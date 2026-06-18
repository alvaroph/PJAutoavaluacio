import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

const STUDENT_EMAIL_REGEX = /^a\d{2}[a-z0-9]/i;

function detectRole(email) {
  const localPart = email.split('@')[0];
  return STUDENT_EMAIL_REGEX.test(localPart) ? 'student' : 'teacher';
}

function signAppToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// GET /api/auth/config — el frontend l'usa per decidir quins mètodes de login mostrar
router.get('/config', (_req, res) => {
  res.json({ googleEnabled: !!config.googleClientId, devLogin: config.devMode, emailLogin: true });
});

// POST /api/auth/dev-login { email, name?, role? }
// Drecera per entrar sense Google mentre no hi ha credencials OAuth configurades.
// Només existeix amb AUTH_DEV_MODE=true; si l'usuari no existeix, es crea amb el rol indicat.
router.post('/dev-login', async (req, res) => {
  if (!config.devMode) {
    return res.status(404).json({ error: 'Ruta no trobada' });
  }
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Cal un correu vàlid' });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const role = ['admin', 'teacher', 'student'].includes(req.body?.role) ? req.body.role : 'student';
    const name = req.body?.name?.trim() || email.split('@')[0];
    user = await prisma.user.create({ data: { email, name, role } });
  }

  res.json({
    token: signAppToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/email-login { email }
// Login per correu del domini sense password. Crea l'usuari si no existeix,
// detectant el rol automàticament pel patró del correu.
router.post('/email-login', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Cal un correu vàlid' });
  }
  if (!email.endsWith('@' + config.allowedDomain)) {
    return res.status(403).json({ error: `Només s'accepten comptes del domini ${config.allowedDomain}` });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const role = detectRole(email);
    const name = email.split('@')[0];
    user = await prisma.user.create({ data: { email, name, role } });
  }

  res.json({
    token: signAppToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/google { credential }
// Valida l'ID token de Google al backend: signatura, audiència, correu verificat
// i domini corporatiu (claim `hd` + sufix del correu). No es confia mai en el frontend.
router.post('/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'Falta el token de Google' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Token de Google no vàlid' });
  }

  const email = (payload.email || '').toLowerCase();
  const domain = config.allowedDomain;

  if (!payload.email_verified) {
    return res.status(403).json({ error: 'El correu del compte no està verificat' });
  }
  // El claim `hd` només existeix en comptes de Google Workspace: l'exigim
  // perquè un gmail.com amb àlies no pugui suplantar el domini.
  if (payload.hd !== domain || !email.endsWith('@' + domain)) {
    return res.status(403).json({ error: `Només s'accepten comptes del domini ${domain}` });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const role = detectRole(email);
    const name = payload.name || email.split('@')[0];
    user = await prisma.user.create({ data: { email, name, role } });
  } else if (payload.name && payload.name !== user.name) {
    // Sincronitza el nom amb el del compte Google si ha canviat
    await prisma.user.update({ where: { id: user.id }, data: { name: payload.name } });
    user = { ...user, name: payload.name };
  }

  res.json({
    token: signAppToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return res.status(401).json({ error: 'Usuari no trobat' });
  res.json({ user });
});

// POST /api/auth/logout — amb JWT sense estat n'hi ha prou que el client descarti el token
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

export default router;

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

function signAppToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(403).json({
      error: 'El teu compte no està donat d\'alta. Demana al professor que t\'importi al curs.',
    });
  }

  // Sincronitza el nom amb el del compte Google si ha canviat
  if (payload.name && payload.name !== user.name) {
    await prisma.user.update({ where: { id: user.id }, data: { name: payload.name } });
    user.name = payload.name;
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

import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Valida el JWT propi de l'aplicació i deixa l'usuari a req.user
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autenticat' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Sessió no vàlida o caducada' });
  }
}

export function requireTeacher(req, res, next) {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accés reservat al professorat' });
  }
  next();
}

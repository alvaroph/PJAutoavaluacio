import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  allowedDomain: (process.env.GOOGLE_ALLOWED_DOMAIN || 'inspedralbes.cat').toLowerCase(),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
};

if (!config.jwtSecret) {
  console.warn('[config] JWT_SECRET no està definit. Defineix-lo abans de desplegar.');
}
if (!config.googleClientId) {
  console.warn('[config] GOOGLE_CLIENT_ID no està definit. El login amb Google no funcionarà.');
}

## Why

L'aplicació ara mateix només es pot desplegar en mode dev (Vite dev server, docker-compose sense optimitzar) i el login amb Google i el login de text son mútuament excloents. Cal un entorn de producció real al VPS, un flux de desplegament net (GitHub → VPS pull), i que el sistema detecti automàticament si un correu és d'alumne o de professor sense haver de configurar-ho manualment.

## What Changes

- Afegir `projectes.inspedralbes.cat` a `server.allowedHosts` al `vite.config.js` perquè el VPS pugui servir el dev server sense errors de "Blocked request".
- Crear un `docker-compose.prod.yml` que serveixi el frontend amb Nginx (build estàtic) i el backend en mode producció, sense Vite dev server ni Adminer.
- Permetre login dual simultani: Google OAuth **i** formulari de correu/contrasenya visibles alhora (no excloents).
- Afegir detecció automàtica de rol per patró de correu: `a` seguit d'un any de 2 dígits i una o més lletres/números (ex. `a25abc`, `a26xyz`) → `student`; qualsevol altre correu del domini → `teacher`.
- Eliminar el camp `role` del formulari de login de text (ja no cal: el sistema el dedueix del correu).

## Capabilities

### New Capabilities

- `prod-deployment`: Docker Compose de producció amb Nginx + backend Node en mode prod, imatge de frontend buildada estàticament, sense eines de dev.
- `dual-login`: Login simultani per Google OAuth i per formulari de correu + contrasenya (ambdós visibles i funcionals alhora, independentment del mode dev/prod).
- `email-role-detection`: Detecció automàtica de rol (`student` vs `teacher`) basada en el patró del correu en el moment del login o creació d'usuari.

### Modified Capabilities

- `vite-host-config`: Afegir `projectes.inspedralbes.cat` (i opcionalment `*` per entorns locals) a `server.allowedHosts` per permetre accés des del VPS.

## Impact

- **Frontend**: `vite.config.js` (allowedHosts), `LoginView.vue` (UI dual login, eliminar selector de rol), `stores/auth.js` (nova crida per login amb text).
- **Backend**: `src/routes/auth.js` (nou endpoint `POST /api/auth/login` amb email+password, lògica de detecció de rol per patró), `src/config.js` (gestió de la clau de hash de passwords), `prisma/schema.prisma` (camp `passwordHash` opcional a `User`).
- **Infraestructura**: `docker-compose.prod.yml` (nou), `frontend/nginx.conf` (nou, per servir l'SPA), `.env.prod.example` (nou, variables de producció).
- **Desplegament**: No cal cap servidor CI/CD: el fluxe és `git push origin main` → SSH al VPS → `git pull && docker compose -f docker-compose.prod.yml up -d --build`.

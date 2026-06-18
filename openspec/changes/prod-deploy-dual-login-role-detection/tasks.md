## 1. Fix immediat: Vite allowedHosts

- [x] 1.1 Afegir `server.allowedHosts: ['projectes.inspedralbes.cat', 'localhost']` a `frontend/vite.config.js`

## 2. Backend: Detecció de rol i endpoint email-login

- [x] 2.1 Afegir funció `detectRole(email)` a `backend/src/routes/auth.js` que aplica el regex `/^a\d{2}[a-z0-9]/i` a la part local del correu i retorna `'student'` o `'teacher'`
- [x] 2.2 Afegir endpoint `POST /api/auth/email-login` a `backend/src/routes/auth.js`: valida el domini, busca o crea l'usuari (amb `detectRole`), retorna JWT
- [x] 2.3 Actualitzar el `POST /api/auth/google` per usar `detectRole` en la creació de nous usuaris (actualment retorna 403 si l'usuari no existeix; ara el crea amb el rol detectat)
- [x] 2.4 Actualitzar `GET /api/auth/config` per incloure `emailLogin: true` sempre (no condicionat a devMode)

## 3. Frontend: Login dual

- [x] 3.1 Afegir mètode `loginWithEmail(email)` a `frontend/src/stores/auth.js` que crida `POST /api/auth/email-login`
- [x] 3.2 Actualitzar `frontend/src/views/LoginView.vue`: mostrar el formulari de correu sempre (no dins del bloc `v-if="authConfig.devLogin"`)
- [x] 3.3 Eliminar el selector de rol del formulari de login; eliminar la variable `devRole`
- [x] 3.4 Canviar la crida de `auth.loginDev()` a `auth.loginWithEmail()` al handler del formulari
- [x] 3.5 Eliminar el badge "Mode desenvolupament" del formulari de correu (ara és un mètode de login normal)

## 4. Docker Compose de producció

- [x] 4.1 Crear `frontend/nginx.conf` amb: serve estàtic de `/usr/share/nginx/html`, `try_files $uri /index.html`, i proxy `/api` → `http://backend:3000`
- [x] 4.2 Crear `frontend/Dockerfile.prod` (build multi-stage: `node:20-alpine` per compilar → `nginx:alpine` per servir)
- [x] 4.3 Crear `docker-compose.prod.yml` amb serveis: `database` (igual que dev), `backend` (amb `NODE_ENV=production`, `AUTH_DEV_MODE=false`), `frontend-nginx` (usa `Dockerfile.prod`, exposa port 80)
- [x] 4.4 Crear `.env.prod.example` amb totes les variables necessàries comentades (`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `GOOGLE_CLIENT_ID`, `GOOGLE_ALLOWED_DOMAIN`, `JWT_SECRET`, `APP_URL`)
- [x] 4.5 Verificar que `docker compose -f docker-compose.prod.yml up --build` funciona localment i l'app és accessible a `http://localhost`

## 5. Verificació final

- [x] 5.1 Comprovar que el login per Google segueix funcionant
- [x] 5.2 Comprovar que el login per formulari funciona sense `AUTH_DEV_MODE=true`
- [x] 5.3 Comprovar que un correu `a25abc@inspedralbes.cat` crea un usuari amb rol `student`
- [x] 5.4 Comprovar que un correu `professor@inspedralbes.cat` crea un usuari amb rol `teacher`
- [x] 5.5 Comprovar que el build de producció serveix correctament les rutes de Vue Router (ex. accedir directament a `/courses`)

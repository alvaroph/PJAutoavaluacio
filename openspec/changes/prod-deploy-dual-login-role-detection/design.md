## Context

L'aplicació és un Vue 3 SPA + backend Express/Prisma/MySQL. Ara mateix:
- `docker-compose.yml` és l'únic fitxer de composició i usa el Vite dev server per al frontend (no apte per producció).
- El login amb Google i el login per text (dev-login) son excloents: si Google està configurat, el formulari desapareix; si no ho està, apareix el formulari però marcat com a "Mode desenvolupament".
- El rol de cada usuari es crea manualment o s'indica en el formulari de dev-login.
- `vite.config.js` no té `allowedHosts`, cosa que bloqueja el Vite dev server quan s'accedeix des d'un domini extern (`projectes.inspedralbes.cat`).

## Goals / Non-Goals

**Goals:**
- Permetre que Vite accepti connexions des de `projectes.inspedralbes.cat` (fix immediat).
- Tenir un `docker-compose.prod.yml` que serveixi el frontend com a build estàtic via Nginx i el backend en mode producció (sense Vite, sense Adminer).
- Fer que el login per formulari (email + submit) i el login amb Google siguin visibles i funcionals alhora, sense dependència del flag `AUTH_DEV_MODE`.
- Detectar automàticament si un correu és d'alumne (`a` + 2 dígits + alfanumèric) o de professor, i assignar el rol en la creació d'usuari o en el login per formulari.

**Non-Goals:**
- Sistema de passwords: el login per formulari és sense password (magic-link o OTP) — simplement introdueixes el correu i si el domini és correcte, entres. Igual que el dev-login actual però sense la restricció `AUTH_DEV_MODE`.
- Configuració CI/CD automàtica (GitHub Actions, webhooks). El desplegament és manual: SSH + pull + `docker compose up`.
- Canviar el sistema de login de Google (ja funciona correctament).
- Aplicació mòbil o altres clients.

## Decisions

### D1: Login per formulari sense password (Email-only login)

**Decisió**: El nou endpoint `POST /api/auth/email-login` accepta únicament un correu del domini `inspedralbes.cat`. Si l'usuari existeix, retorna el token. Si no existeix, el crea amb el rol detectat automàticament pel patró del correu i retorna el token.

**Alternativa descartada**: Login amb password. Requeriria bcrypt, flux de creació/recuperació de passwords, i complexitat innecessària per a un entorn escolar on Google Workspace ja gestiona les identitats.

**Per què no és un risc de seguretat**: L'accés és restringit al domini `inspedralbes.cat`. Qui tingui accés a un correu del domini ja té credencials Google — el formulari és una via alternativa per quan Google OAuth no és convenient (proves, VPS sense domini SSL vàlid per Google, etc.).

### D2: Detecció de rol per patró regex

**Decisió**: `STUDENT_EMAIL_REGEX = /^a\d{2}[a-z0-9]/i` aplicada a la part local del correu (abans de `@`). Si coincideix → `student`; si no → `teacher`. S'aplica en el moment de crear l'usuari (tant al Google login com al email-only login).

**Alternativa descartada**: Mantenir el camp `role` en el formulari. Implica que l'usuari pot escollir el rol, cosa que és un vector d'escalada de privilegis (un alumne podria triar `teacher`).

**Nota**: Els usuaris existents no es migren automàticament. El patró s'aplica únicament en la creació. Un admin pot canviar el rol manualment si cal.

### D3: Docker Compose de producció separat

**Decisió**: `docker-compose.prod.yml` amb:
- Frontend: build multi-stage (Node per compilar → Nginx per servir). L'Nginx serveix l'SPA i fa proxy de `/api` cap al backend.
- Backend: mode producció (sense `AUTH_DEV_MODE`, amb `NODE_ENV=production`).
- Base de dades: igual que ara.
- **Sense** Adminer (no s'exposa a producció).
- **Sense** ports directes del frontend (Nginx gestiona l'accés extern).

**Alternativa descartada**: Modificar el `docker-compose.yml` existent amb profiles. Manté la complexitat baixa: un fitxer per a dev, un per a prod. El VPS fa `docker compose -f docker-compose.prod.yml up -d --build`.

### D4: Fix del allowedHosts de Vite

**Decisió**: Afegir `server.allowedHosts: ['projectes.inspedralbes.cat', 'localhost']` al `vite.config.js`. Això és suficient per a l'ús actual.

**Alternativa**: `allowedHosts: 'all'`. Més simple però menys segur. Preferim la llista explícita.

### D5: Login dual sense flag AUTH_DEV_MODE

**Decisió**: El nou endpoint `email-login` no depèn de `devMode`. El frontend sempre mostra el formulari de correu al costat del botó de Google (si Google està configurat) o en lloc del missatge d'error (si no ho està). El `dev-login` original es manté per compatibilitat però marcat com a deprecat.

**Alternativa descartada**: Reutilitzar `dev-login` i treure la restricció `devMode`. Semànticament incorrecte i deixaria el nom confús.

## Risks / Trade-offs

- **[Risc] Email-only login sense 2FA** → Mitigació: restringit al domini corporatiu. En un futur es pot afegir OTP per email si cal.
- **[Risc] Rol assignat incorrectament si el patró no coincideix** → Mitigació: el patró és prou específic i els casos edge (noms estranys) cauen a `teacher`, que té menys permisos per defecte que `admin` però pot gestionar cursos.
- **[Trade-off] Dos docker-compose** → Simplicitat: dev i prod son entorns radicalment diferentes (dev server vs Nginx, Adminer vs sense, ports vs nginx proxy). Un sol fitxer amb profiles seria més complex.
- **[Risc] Nginx.conf mal configurat per a l'SPA** → Mitigació: s'inclou `try_files $uri $uri/ /index.html` per gestionar les rutes de Vue Router.

## Migration Plan

1. **Fase 1 (immediata)**: Fix `vite.config.js` → redesplegar el dev server al VPS. Resol el "Blocked request" sense trencar res.
2. **Fase 2**: Crear `docker-compose.prod.yml` + `frontend/nginx.conf` + `.env.prod.example`. Provar localment amb `docker compose -f docker-compose.prod.yml up --build`.
3. **Fase 3**: Afegir `POST /api/auth/email-login` al backend + lògica de detecció de rol. Actualitzar `LoginView.vue` per mostrar el formulari sempre.
4. **Rollback**: Tornar al `docker-compose.yml` original i revertir `vite.config.js`. Cap migració de dades necessària.

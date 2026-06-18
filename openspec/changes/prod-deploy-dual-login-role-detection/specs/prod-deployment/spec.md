## ADDED Requirements

### Requirement: Docker Compose de producció
El projecte SHALL tenir un fitxer `docker-compose.prod.yml` independent que defineixi un entorn de producció sense eines de desenvolupament.

#### Scenario: Desplegament de producció
- **WHEN** s'executa `docker compose -f docker-compose.prod.yml up -d --build` al VPS
- **THEN** s'aixequen els serveis: `database`, `backend` i `frontend-nginx` (sense Adminer, sense Vite dev server)

#### Scenario: Frontend servit com a build estàtic
- **WHEN** el contenidor `frontend-nginx` arrenca
- **THEN** Nginx serveix els fitxers estàtics generats per `npm run build` i fa proxy de `/api` cap al servei `backend`

### Requirement: Nginx per a SPA Vue
El `frontend/nginx.conf` SHALL estar configurat per servir correctament una SPA Vue 3 (rutes de Vue Router funcionals).

#### Scenario: Ruta de Vue Router directa
- **WHEN** l'usuari accedeix directament a una ruta de l'aplicació (ex. `/courses`)
- **THEN** Nginx retorna `index.html` i Vue Router gestiona la ruta al client (no retorna 404)

### Requirement: Variables d'entorn de producció documentades
SHALL existir un fitxer `.env.prod.example` amb totes les variables necessàries per a producció, amb valors d'exemple i comentaris.

#### Scenario: Primer desplegament
- **WHEN** un administrador copia `.env.prod.example` a `.env.prod` i omple els valors reals
- **THEN** l'aplicació arrenca correctament a producció sense configuració addicional

### Requirement: Backend en mode producció
El servei backend al `docker-compose.prod.yml` SHALL tenir `NODE_ENV=production` i `AUTH_DEV_MODE=false` explícits.

#### Scenario: Mode producció actiu
- **WHEN** el backend arrenca amb el docker-compose de producció
- **THEN** el flag `AUTH_DEV_MODE` és `false` i no s'imprimeix el warning de dev mode

# Autoavaluació i coavaluació de projectes

Aplicació web per gestionar processos d'autoavaluació i coavaluació d'alumnes que treballen en projectes de grup a l'institut.

- Els **professors** creen cursos, importen alumnes (copiant i enganxant un llistat), creen projectes i grups, obren/tanquen votacions i exporten els resultats.
- Els **alumnes** entren amb el seu compte Google corporatiu (`@inspedralbes.cat`), veuen el seu grup i posen una nota de 0 a 10 a si mateixos i a cada company de grup.

## Stack

| Capa | Tecnologia |
| --- | --- |
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de dades | MySQL 8 |
| Autenticació | Google OpenID Connect (validació del token i del domini al **backend**) |
| Desplegament | Docker Compose |

## Posada en marxa

### 1. Credencials de Google

1. Ves a [Google Cloud Console → Credencials](https://console.cloud.google.com/apis/credentials).
2. Crea un **ID de client OAuth** de tipus *Aplicació web*.
3. Afegeix `http://localhost:5173` als *Orígens JavaScript autoritzats*.
4. Copia el *Client ID*.

### 2. Variables d'entorn

```bash
cp .env.example .env
# Edita .env: GOOGLE_CLIENT_ID, JWT_SECRET i ADMIN_EMAILS / TEACHER_EMAILS
```

Els correus d'`ADMIN_EMAILS` i `TEACHER_EMAILS` es donen d'alta automàticament com a professorat en arrencar el backend. Els alumnes es creen mitjançant la importació de llistats des del panell del professor.

### Sense credencials de Google (mode desenvolupament)

Si encara no tens el `GOOGLE_CLIENT_ID`, posa `AUTH_DEV_MODE=true` al `.env` (és el valor per defecte de `.env.example`). La pantalla de login mostrarà un formulari per entrar directament amb qualsevol correu com a **professor** o **alumne**, sense OAuth. Si l'usuari no existeix, es crea amb el rol triat.

> ⚠️ Desactiva `AUTH_DEV_MODE` abans de posar l'aplicació en producció: permet entrar sense cap autenticació real.

### 3. Aixecar l'aplicació

```bash
docker compose up --build
```

| Servei | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/health |
| Adminer (gestió BD) | http://localhost:8080 (servidor `database`, usuari `root`) |

## Seguretat

- L'ID token de Google es valida **sempre al backend** (signatura, audiència, `email_verified`).
- El domini corporatiu es comprova amb el claim `hd` **i** el sufix del correu; amagar opcions al frontend no és cap control.
- El backend emet un JWT propi; tots els endpoints comproven rol i pertinença:
  - un alumne només pot veure i votar el **seu** grup;
  - només es pot votar amb la votació **oberta** (cada nou enviament substitueix l'anterior);
  - les rutes de professor retornen `403` als alumnes;
  - una única valoració activa per parella avaluador/avaluat i projecte (restricció única a BD).

## Funcionament

1. El professor crea un curs (p. ex. `2DAW`) i hi importa alumnes enganxant línies `Nom Cognoms;correu@inspedralbes.cat` (amb previsualització i detecció d'errors i duplicats).
2. Crea un projecte dins del curs i hi defineix grups, assignant-hi els alumnes (amb llistat d'alumnes sense grup).
3. Obre la votació. Si hi ha alumnes sense grup, l'aplicació avisa i demana confirmació.
4. Cada alumne entra, veu el seu grup i posa nota a si mateix (autoavaluació) i a cada company (coavaluació). Pot modificar-les mentre la votació estigui oberta.
5. El professor tanca la votació i consulta el resum per alumne: autoavaluació, mitjana de coavaluacions rebudes (`Sense dades` si no n'ha rebut cap), nombre de valoracions rebudes i estat de participació.
6. Exporta els resultats en CSV (separador `;` i coma decimal, pensat per a Excel en català/castellà).

## Desenvolupament sense Docker

```bash
# Backend (cal una MySQL accessible i les variables d'entorn de .env.example)
cd backend
npm install
npx prisma db push && node prisma/seed.js
npm run dev

# Frontend (proxy /api cap a http://localhost:3000)
cd frontend
npm install
VITE_GOOGLE_CLIENT_ID=<client-id> npm run dev
```

## Estructura

```txt
docker-compose.yml
backend/
  prisma/schema.prisma      # users, courses, course_students, projects, groups, group_members, evaluations
  prisma/seed.js            # alta inicial de professors des d'ADMIN_EMAILS/TEACHER_EMAILS
  src/
    index.js                # Express + muntatge de rutes
    middleware/auth.js      # requireAuth (JWT) i requireTeacher
    routes/
      auth.js               # login amb Google, /me, logout
      courses.js            # CRUD de cursos
      students.js           # importació amb previsualització + llistat
      projects.js           # CRUD + obrir/tancar votació
      groups.js             # grups i membres
      evaluations.js        # rutes d'alumne: my-projects, my-group, my-evaluations
      results.js            # resum per alumne + exportació CSV
frontend/
  src/
    views/                  # Login, panell, cursos, importació, projectes, grups, votació, resultats
    components/             # StudentImportBox, GroupCard, EvaluationForm, ResultsTable
    stores/auth.js          # sessió (Pinia)
    router/index.js         # rutes amb guarda per rol
```

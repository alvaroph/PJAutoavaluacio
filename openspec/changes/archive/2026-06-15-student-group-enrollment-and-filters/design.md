## Context

L'aplicació gestiona projectes amb grups d'alumnes. Actualment els professors assignen manualment els alumnes als grups via `ProjectGroupsView`. El model `Project` té un `status` (draft/open/closed/archived) però no té cap mecanisme per controlar si els alumnes es poden autoassignar als grups. Les pàgines `ProjectsView` i `QuestionnairesView` mostren tots els elements sense cap filtre, cosa que és inmanejable quan el nombre d'elements creix.

Stack: Vue 3 (Composition API + Pinia), Express.js + Prisma (MySQL), JWT auth.

## Goals / Non-Goals

**Goals:**
- Permetre als professors obrir/tancar el període d'inscripció per projecte
- Permetre als alumnes unir-se i abandonar grups mentre el període és obert
- Congelar els grups quan el professor tanca el període (immutables per a tothom)
- Afegir filtres de curs, estat i cerca de text a ProjectsView i QuestionnairesView

**Non-Goals:**
- Límit màxim de membres per grup (queda fora d'aquest canvi)
- Notificacions push quan s'obre/tanca el període
- Creació de grups per part dels alumnes (els grups els crea el professor)

## Decisions

### D1: Camp `enrollmentOpen` a `Project` (no nou status)

**Decisió**: Afegir `enrollmentOpen Boolean @default(false)` al model `Project` en lloc d'afegir nous valors a l'enum `ProjectStatus`.

**Alternativa descartada**: Afegir `enrolling` com a nou valor de `ProjectStatus`. Això complicaria la màquina d'estats (open→enrolling→open?) i trencaria lògica existent que depèn de l'status.

**Raó**: `enrollmentOpen` és ortogonal a l'status del projecte. Un projecte pot estar `open` (actiu) i tenir la inscripció oberta o tancada independentment. Separa clarament les responsabilitats.

### D2: Endpoints REST nous, no modificació dels existents

**Decisió**: Nous endpoints dedicats:
- `PATCH /api/projects/:id/enrollment` → `{ enrollmentOpen: boolean }` (professor)
- `POST /api/groups/:id/join` → alumne s'uneix al grup
- `DELETE /api/groups/:id/leave` → alumne abandona el grup

**Alternativa descartada**: Reutilitzar `POST /api/groups/:id/members` afegint lògica d'autorització basada en el rol. Barrejaria la lògica d'admin (professor) amb la d'autoservei (alumne) en un sol endpoint, dificultant auditoria i manteniment.

### D3: Validació d'inscripció al backend (no confiança en el frontend)

El backend ha de validar:
1. `project.enrollmentOpen === true` per a join/leave
2. L'usuari és un alumne matriculat al curs del projecte
3. Un alumne no pot pertànyer a dos grups del mateix projecte

### D4: Filtres com a query params a l'API existent

**Decisió**: Afegir query params opcionals als endpoints `GET /api/projects` i `GET /api/questionnaires` (`?courseId=`, `?status=`, `?search=`). El filtratge és server-side amb Prisma `where`.

**Alternativa descartada**: Filtratge client-side sobre tots els resultats. Ineficient i no escala.

### D5: Components de filtre reutilitzables

Crear un component `FilterBar.vue` genèric que accepti configuració via props, reutilitzable a ProjectsView i QuestionnairesView per evitar duplicació.

## Risks / Trade-offs

- **[Risc] Condicions de carrera en join/leave concurrent** → El constraint `@@unique([groupId, userId])` a `GroupMember` ja prevé duplicats. Retornar 409 si ja existeix.
- **[Risc] Alumne en múltiples grups del mateix projecte** → Validar al backend que l'alumne no té cap `GroupMember` actiu en cap altre grup del mateix `projectId` abans del join.
- **[Trade-off] `enrollmentOpen` no té historial d'obertures** → Acceptat per simplicitat; si cal auditoria, s'afegirà en un canvi futur.

## Migration Plan

1. Afegir `enrollmentOpen Boolean @default(false)` al schema Prisma
2. Executar `npx prisma migrate dev --name add_enrollment_open_to_project`
3. Els projectes existents queden amb `enrollmentOpen = false` (comportament conservador, sense canvis visibles)
4. Desplegar backend i frontend junts (no hi ha incompatibilitats de versió)

## Open Questions

- Els professors podran tornar a obrir el període d'inscripció un cop tancat? → Per defecte sí (el camp és un booleà que pot canviar), però caldrà confirmar amb els professors si volen una restricció de "tancat = permanent".

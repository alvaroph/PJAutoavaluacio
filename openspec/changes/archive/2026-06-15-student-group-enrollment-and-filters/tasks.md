## 1. Base de dades i schema

- [x] 1.1 Afegir camp `enrollmentOpen Boolean @default(false)` al model `Project` al schema Prisma
- [x] 1.2 Executar migració Prisma (`npx prisma migrate dev --name add_enrollment_open_to_project`)
- [x] 1.3 Verificar que els projectes existents tenen `enrollmentOpen = false` per defecte

## 2. Backend – Gestió del període d'inscripció

- [x] 2.1 Afegir endpoint `PATCH /api/projects/:id/enrollment` (només professors) que actualitzi `enrollmentOpen`
- [x] 2.2 Afegir middleware de validació: únicament rol `teacher` pot accedir a l'endpoint 2.1
- [x] 2.3 Retornar el camp `enrollmentOpen` als endpoints `GET /api/projects` i `GET /api/projects/:id`

## 3. Backend – Autoassignació d'alumnes als grups

- [x] 3.1 Afegir endpoint `POST /api/groups/:id/join` per a alumnes
- [x] 3.2 Implementar validació al join: `enrollmentOpen === true`, alumne matriculat al curs, alumne sense grup al projecte
- [x] 3.3 Afegir endpoint `DELETE /api/groups/:id/leave` per a alumnes
- [x] 3.4 Implementar validació al leave: `enrollmentOpen === true`, alumne és membre del grup
- [x] 3.5 Retornar errors adequats (403, 409) amb missatges descriptius en català

## 4. Backend – Filtres de projectes i pràctiques

- [x] 4.1 Afegir suport de query params `courseId`, `status` i `search` a `GET /api/projects`
- [x] 4.2 Implementar filtratge Prisma `where` per `courseId`, `status` i cerca `contains` en nom/descripció
- [x] 4.3 Afegir suport de query params `courseId`, `status` i `search` a `GET /api/questionnaires`
- [x] 4.4 Implementar filtratge Prisma `where` per a qüestionaris (mateixos criteris)

## 5. Frontend – Component FilterBar reutilitzable

- [x] 5.1 Crear component `FilterBar.vue` amb props: `courses`, `statuses`, `modelValue` (objecte `{ courseId, status, search }`)
- [x] 5.2 Implementar selector de curs (dropdown), selector d'estat (dropdown) i camp de cerca de text
- [x] 5.3 Emetre event `update:modelValue` en qualsevol canvi de filtre

## 6. Frontend – Filtres a la pàgina de Projectes

- [x] 6.1 Integrar `FilterBar.vue` a `ProjectsView.vue`
- [x] 6.2 Passar els filtres com a query params a la crida API de projectes
- [x] 6.3 Mostrar missatge "No s'han trobat projectes amb aquests filtres" quan la llista és buida per filtre
- [x] 6.4 Mantenir l'estat dels filtres durant la navegació interna (state local del component)

## 7. Frontend – Filtres a la pàgina de Pràctiques

- [x] 7.1 Integrar `FilterBar.vue` a `QuestionnairesView.vue`
- [x] 7.2 Passar els filtres com a query params a la crida API de qüestionaris
- [x] 7.3 Mostrar missatge "No s'han trobat pràctiques amb aquests filtres" quan la llista és buida per filtre
- [x] 7.4 Mantenir l'estat dels filtres durant la navegació interna (state local del component)

## 8. Frontend – Gestió del període d'inscripció (professor)

- [x] 8.1 Afegir botó "Obrir inscripció" / "Tancar inscripció" a la vista de grups del projecte (`ProjectGroupsView.vue`)
- [x] 8.2 Cridar `PATCH /api/projects/:id/enrollment` en fer clic al botó i actualitzar l'estat local
- [x] 8.3 Mostrar badge/indicador de l'estat actual d'inscripció (oberta/tancada) al professor

## 9. Frontend – Autoassignació d'alumnes als grups

- [x] 9.1 A `StudentProjectsView.vue` (o equivalent), mostrar grups del projecte quan `enrollmentOpen === true`
- [x] 9.2 Mostrar botó "Unir-se" a cada grup quan l'alumne no té grup assignat
- [x] 9.3 Mostrar el grup de l'alumne destacat amb botó "Abandonar grup" quan ja és membre
- [x] 9.4 Cridar `POST /api/groups/:id/join` i `DELETE /api/groups/:id/leave` i refrescar la vista
- [x] 9.5 Mostrar errors de validació (409, 403) de forma amigable a l'usuari
- [x] 9.6 Ocultar controls d'acció quan `enrollmentOpen === false` (mode lectura)

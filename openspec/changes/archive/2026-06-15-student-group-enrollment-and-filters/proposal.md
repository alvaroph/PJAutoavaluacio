## Why

Actualment els professors han d'assignar manualment els alumnes als grups de projectes, cosa que genera feina administrativa i errors. Es vol que els alumnes es puguin autoassignar als grups durant un període d'inscripció controlat, i afegir filtres a les pàgines de projectes i pràctiques per facilitar la navegació quan hi ha molts elements.

## What Changes

- **Nou camp `enrollmentOpen` a `Project`**: booleà que indica si el període d'inscripció als grups està obert. Els professors l'activen i tanquen manualment.
- **Autoassignació d'alumnes als grups**: quan `enrollmentOpen` és `true`, els alumnes del curs poden unir-se o abandonar grups del projecte ells mateixos.
- **Tancament d'inscripció**: els professors tanquen el període (`enrollmentOpen = false`), moment a partir del qual els grups queden congelats i no es poden modificar (ni professors ni alumnes).
- **Filtres a la pàgina de Projectes**: per curs, estat del projecte i/o paraula clau.
- **Filtres a la pàgina de Pràctiques (Qüestionaris)**: per curs, estat del qüestionari i/o paraula clau.

## Capabilities

### New Capabilities

- `group-enrollment`: Gestió del període d'inscripció als grups — obrir/tancar des del professor, i autoassignació d'alumnes mentre el període és obert.
- `project-filters`: Filtres a la llista de projectes per curs, estat i cerca de text.
- `practice-filters`: Filtres a la llista de pràctiques/qüestionaris per curs, estat i cerca de text.

### Modified Capabilities

<!-- Cap especificació existent canvia requisits a nivell de spec -->

## Impact

- **Backend – Prisma schema**: nou camp `enrollmentOpen Boolean @default(false)` a `Project`.
- **Backend – Migració**: nova migració Prisma per afegir el camp.
- **Backend – API REST**: nous endpoints o modificació dels existents per obrir/tancar inscripció i per a l'autoassignació d'alumnes (`POST /groups/:id/join`, `DELETE /groups/:id/leave`, `PATCH /projects/:id/enrollment`).
- **Frontend – pàgina de Projectes**: afegir controls de filtre (curs, estat, cerca).
- **Frontend – pàgina de Pràctiques**: afegir controls de filtre (curs, estat, cerca).
- **Frontend – vista de Grups (alumne)**: nova UI per veure grups disponibles i unir-s'hi o abandonar-los.
- **Autorització**: les accions d'autoassignació s'han de restringir a alumnes del curs i validar que `enrollmentOpen` sigui `true`.

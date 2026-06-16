## ADDED Requirements

### Requirement: Professor pot obrir el període d'inscripció
El sistema SHALL permetre a un professor activar el període d'inscripció d'un projecte (`enrollmentOpen = true`), moment a partir del qual els alumnes es poden afegir als grups ells mateixos.

#### Scenario: Professor obre inscripció
- **WHEN** un professor fa `PATCH /api/projects/:id/enrollment` amb `{ "enrollmentOpen": true }`
- **THEN** el sistema actualitza `project.enrollmentOpen = true` i retorna 200 amb el projecte actualitzat

#### Scenario: Usuari no autoritzat intenta obrir inscripció
- **WHEN** un alumne fa `PATCH /api/projects/:id/enrollment`
- **THEN** el sistema retorna 403 Forbidden

### Requirement: Professor pot tancar el període d'inscripció
El sistema SHALL permetre a un professor desactivar el període d'inscripció (`enrollmentOpen = false`), moment a partir del qual els grups queden congelats i cap alumne pot unir-se ni abandonar cap grup del projecte.

#### Scenario: Professor tanca inscripció
- **WHEN** un professor fa `PATCH /api/projects/:id/enrollment` amb `{ "enrollmentOpen": false }`
- **THEN** el sistema actualitza `project.enrollmentOpen = false` i retorna 200

#### Scenario: Intent d'unió a grup amb inscripció tancada
- **WHEN** un alumne intenta fer join a un grup i `project.enrollmentOpen === false`
- **THEN** el sistema retorna 403 amb missatge "La inscripció a grups d'aquest projecte és tancada"

### Requirement: Alumne pot unir-se a un grup
El sistema SHALL permetre a un alumne matriculat al curs unir-se a un grup d'un projecte quan el període d'inscripció és obert, sempre que no pertanyi ja a cap altre grup del mateix projecte.

#### Scenario: Alumne s'uneix correctament a un grup
- **WHEN** un alumne fa `POST /api/groups/:id/join` i `enrollmentOpen === true` i no pertany a cap grup del projecte
- **THEN** es crea un `GroupMember` i el sistema retorna 201 amb el grup actualitzat

#### Scenario: Alumne ja pertany a un altre grup del projecte
- **WHEN** un alumne fa `POST /api/groups/:id/join` i ja és membre d'un altre grup del mateix projecte
- **THEN** el sistema retorna 409 amb missatge "Ja pertanys a un grup d'aquest projecte"

#### Scenario: Alumne no matriculat al curs intenta unir-se
- **WHEN** un alumne no matriculat al curs intenta fer join
- **THEN** el sistema retorna 403 Forbidden

### Requirement: Alumne pot abandonar un grup
El sistema SHALL permetre a un alumne abandonar un grup del qual és membre, sempre que el període d'inscripció sigui obert.

#### Scenario: Alumne abandona un grup correctament
- **WHEN** un alumne fa `DELETE /api/groups/:id/leave` i `enrollmentOpen === true` i és membre del grup
- **THEN** s'elimina el `GroupMember` corresponent i el sistema retorna 200

#### Scenario: Alumne intenta abandonar grup amb inscripció tancada
- **WHEN** un alumne fa `DELETE /api/groups/:id/leave` i `enrollmentOpen === false`
- **THEN** el sistema retorna 403 amb missatge "La inscripció a grups d'aquest projecte és tancada"

### Requirement: Visualització de l'estat d'inscripció per a l'alumne
El sistema SHALL mostrar a l'alumne, a la vista de projectes, si un projecte té el període d'inscripció obert i a quin grup pertany (si n'és membre).

#### Scenario: Projecte amb inscripció oberta i alumne sense grup
- **WHEN** l'alumne accedeix a la vista d'un projecte amb `enrollmentOpen === true`
- **THEN** veu la llista de grups disponibles amb un botó "Unir-se" a cadascun

#### Scenario: Alumne ja membre d'un grup
- **WHEN** l'alumne és membre d'un grup del projecte
- **THEN** veu el seu grup destacat amb un botó "Abandonar grup" i no veu el botó "Unir-se" als altres grups

#### Scenario: Projecte amb inscripció tancada
- **WHEN** l'alumne accedeix a un projecte amb `enrollmentOpen === false`
- **THEN** veu els grups en mode lectura sense botons d'acció d'inscripció

## ADDED Requirements

### Requirement: Login per correu sempre disponible
El sistema SHALL oferir un formulari de login per correu electrònic (`POST /api/auth/email-login`) que funcioni independentment del flag `AUTH_DEV_MODE` i simultàniament amb el login de Google.

#### Scenario: Login per correu amb usuari existent
- **WHEN** l'usuari introdueix un correu del domini `inspedralbes.cat` i fa submit
- **THEN** el sistema verifica que el correu pertany al domini, troba l'usuari a la base de dades i retorna un JWT vàlid

#### Scenario: Login per correu amb usuari nou
- **WHEN** l'usuari introdueix un correu del domini `inspedralbes.cat` que no existeix a la BD
- **THEN** el sistema crea l'usuari amb el rol detectat automàticament i retorna un JWT vàlid

#### Scenario: Login per correu amb domini incorrecte
- **WHEN** l'usuari introdueix un correu que no pertany al domini `inspedralbes.cat`
- **THEN** el sistema retorna un error 403 amb missatge "Només s'accepten comptes del domini inspedralbes.cat"

### Requirement: UI de login dual
El `LoginView.vue` SHALL mostrar el botó de Google (si `VITE_GOOGLE_CLIENT_ID` està configurat) i el formulari de correu simultàniament i en tot moment, sense que un exclogui l'altre.

#### Scenario: Ambdós mètodes visibles
- **WHEN** l'usuari obre la pàgina de login amb Google configurat
- **THEN** veu el botó de Google I el formulari de correu al mateix temps

#### Scenario: Formulari de correu sense Google
- **WHEN** `VITE_GOOGLE_CLIENT_ID` no està configurat
- **THEN** el formulari de correu és visible i funcional (sense el missatge d'error de "Google no configurat")

### Requirement: Eliminació del selector de rol del formulari
El formulari de login per correu NO SHALL mostrar un selector de rol. El rol l'assigna el sistema automàticament.

#### Scenario: Formulari sense selector de rol
- **WHEN** l'usuari veu el formulari de login
- **THEN** només veu un camp de correu electrònic i el botó d'entrar (sense cap selector de rol)

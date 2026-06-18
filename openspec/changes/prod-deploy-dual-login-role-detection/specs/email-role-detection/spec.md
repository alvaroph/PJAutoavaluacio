## ADDED Requirements

### Requirement: Detecció automàtica de rol per patró de correu
El sistema SHALL detectar automàticament si un usuari és alumne o professor en base al patró de la part local del correu electrònic. El patró d'alumne és: lletra `a` seguida de 2 dígits i almenys un caràcter alfanumèric (ex. `a25abc`, `a26xyz1`). Qualsevol altre correu del domini es tracta com a professor.

#### Scenario: Correu d'alumne detectat correctament
- **WHEN** s'crea un usuari amb correu `a25abc@inspedralbes.cat`
- **THEN** el rol assignat és `student`

#### Scenario: Correu d'alumne amb any diferent
- **WHEN** s'crea un usuari amb correu `a26xyz@inspedralbes.cat`
- **THEN** el rol assignat és `student`

#### Scenario: Correu de professor detectat correctament
- **WHEN** s'crea un usuari amb correu `profesor.nom@inspedralbes.cat`
- **THEN** el rol assignat és `teacher`

#### Scenario: Correu que comença per a però sense patró d'alumne
- **WHEN** s'crea un usuari amb correu `anna@inspedralbes.cat`
- **THEN** el rol assignat és `teacher` (no segueix el patró `a` + 2 dígits + alfanumèric)

### Requirement: Detecció de rol consistent entre mètodes de login
La detecció de rol SHALL aplicar-se tant al login per correu (`email-login`) com al login per Google (quan es crea un usuari nou per primer cop).

#### Scenario: Primer login amb Google d'un alumne
- **WHEN** un alumne amb correu `a25abc@inspedralbes.cat` fa login amb Google per primer cop (no existeix a la BD)
- **THEN** el sistema crea l'usuari amb rol `student` automàticament

#### Scenario: Primer login per formulari d'un professor
- **WHEN** un professor amb correu `joan.martinez@inspedralbes.cat` fa login per formulari per primer cop
- **THEN** el sistema crea l'usuari amb rol `teacher` automàticament

### Requirement: Usuaris existents no es modifiquen
La detecció de rol SHALL aplicar-se únicament en la creació d'un usuari nou. Els usuaris existents mantenen el seu rol actual.

#### Scenario: Login repetit no canvia el rol
- **WHEN** un usuari existent (rol `teacher`) fa login amb el correu `a25abc@inspedralbes.cat`
- **THEN** el seu rol continua sent `teacher` (no es sobreescriu)

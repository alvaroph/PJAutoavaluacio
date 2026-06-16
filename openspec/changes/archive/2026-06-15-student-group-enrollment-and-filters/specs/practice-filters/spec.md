## ADDED Requirements

### Requirement: Filtre de pràctiques per curs
El sistema SHALL permetre filtrar la llista de qüestionaris/pràctiques per curs.

#### Scenario: Filtre per curs seleccionat
- **WHEN** l'usuari selecciona un curs al filtre de la pàgina de pràctiques
- **THEN** la llista mostra únicament els qüestionaris pertanyents a aquell curs

#### Scenario: Sense filtre de curs
- **WHEN** no hi ha cap curs seleccionat al filtre
- **THEN** la llista mostra tots els qüestionaris als quals l'usuari té accés

### Requirement: Filtre de pràctiques per estat
El sistema SHALL permetre filtrar la llista de qüestionaris per estat (`draft`, `open`, `closed`).

#### Scenario: Filtre per estat seleccionat
- **WHEN** l'usuari selecciona un estat al filtre de la pàgina de pràctiques
- **THEN** la llista mostra únicament els qüestionaris en aquell estat

#### Scenario: Combinació de filtres curs i estat
- **WHEN** l'usuari selecciona curs i estat simultàniament
- **THEN** la llista mostra els qüestionaris que compleixen ambdós criteris (AND lògic)

### Requirement: Cerca de pràctiques per text
El sistema SHALL permetre cercar qüestionaris per nom o descripció.

#### Scenario: Cerca per text coincident
- **WHEN** l'usuari escriu text al camp de cerca de la pàgina de pràctiques
- **THEN** la llista es filtra mostrant qüestionaris on el nom o la descripció conté el text (insensible a majúscules)

#### Scenario: Cerca sense resultats
- **WHEN** el text cercat no coincideix amb cap qüestionari
- **THEN** la llista mostra un missatge "No s'han trobat pràctiques amb aquests filtres"

### Requirement: Persistència de filtres durant la sessió
El sistema SHALL mantenir els filtres seleccionats mentre l'usuari navega dins la pàgina de pràctiques, però els reseteja en tornar a la vista des d'una altra ruta.

#### Scenario: Filtres mantinguts durant navegació interna
- **WHEN** l'usuari aplica filtres i accedeix a un qüestionari i torna enrere
- **THEN** els filtres continuen aplicats

#### Scenario: Reset de filtres en accedir de nova
- **WHEN** l'usuari accedeix a la pàgina de pràctiques des del menú lateral
- **THEN** els filtres es restableixen als valors per defecte (sense filtre)

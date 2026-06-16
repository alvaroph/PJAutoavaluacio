## ADDED Requirements

### Requirement: Filtre de projectes per curs
El sistema SHALL permetre filtrar la llista de projectes per curs, mostrant únicament els projectes pertanyents al curs seleccionat.

#### Scenario: Filtre per curs seleccionat
- **WHEN** l'usuari selecciona un curs al filtre de la pàgina de projectes
- **THEN** la llista mostra únicament els projectes d'aquell curs

#### Scenario: Sense filtre de curs
- **WHEN** no hi ha cap curs seleccionat al filtre
- **THEN** la llista mostra tots els projectes als quals l'usuari té accés

### Requirement: Filtre de projectes per estat
El sistema SHALL permetre filtrar la llista de projectes per estat (`draft`, `open`, `closed`, `archived`).

#### Scenario: Filtre per estat seleccionat
- **WHEN** l'usuari selecciona un estat al filtre de la pàgina de projectes
- **THEN** la llista mostra únicament els projectes en aquell estat

#### Scenario: Combinació de filtres curs i estat
- **WHEN** l'usuari selecciona curs i estat simultàniament
- **THEN** la llista mostra els projectes que compleixen ambdós criteris (AND lògic)

### Requirement: Cerca de projectes per text
El sistema SHALL permetre cercar projectes per nom o descripció mitjançant un camp de text lliure.

#### Scenario: Cerca per text coincident
- **WHEN** l'usuari escriu text al camp de cerca de la pàgina de projectes
- **THEN** la llista es filtra en temps real mostrant projectes on el nom o la descripció conté el text (insensible a majúscules)

#### Scenario: Cerca sense resultats
- **WHEN** el text cercat no coincideix amb cap projecte
- **THEN** la llista mostra un missatge "No s'han trobat projectes amb aquests filtres"

### Requirement: Persistència de filtres durant la sessió
El sistema SHALL mantenir els filtres seleccionats mentre l'usuari navega dins la pàgina de projectes, però els reseteja en tornar a la vista des d'una altra ruta.

#### Scenario: Filtres mantinguts durant navegació interna
- **WHEN** l'usuari aplica filtres i navega a un projecte i torna enrere
- **THEN** els filtres continuen aplicats

#### Scenario: Reset de filtres en accedir de nova
- **WHEN** l'usuari accedeix a la pàgina de projectes des del menú lateral
- **THEN** els filtres es restableixen als valors per defecte (sense filtre)

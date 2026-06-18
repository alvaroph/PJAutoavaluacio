## ADDED Requirements

### Requirement: Vite accepta connexions des de l'host del VPS
El `vite.config.js` SHALL incloure `projectes.inspedralbes.cat` a la llista `server.allowedHosts` perquè el Vite dev server no bloquegi peticions des del domini del VPS.

#### Scenario: Accés des de projectes.inspedralbes.cat
- **WHEN** el navegador accedeix al Vite dev server via `https://projectes.inspedralbes.cat`
- **THEN** el servidor respon correctament sense retornar l'error "Blocked request. This host is not allowed"

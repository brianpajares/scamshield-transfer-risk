# Politica de sincronizacion Drive + GitHub

## Regla operativa

Todo documento producido para este aplicativo debe existir en dos lugares:

1. GitHub: `brianpajares/scamshield-transfer-risk`
2. Google Drive: carpeta `ScamShield_Transfer_Risk`

GitHub es la fuente de verdad para codigo, migraciones, configuracion y documentos Markdown versionables.

Google Drive es la fuente de trabajo/consulta para documentos de negocio, handoff, PRD, auditoria y entregables compartibles.

## Documentos que deben sincronizarse

- `README.md`
- `CHANGELOG.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/MONETIZATION.md`
- `docs/PRD_REVIEW.md`
- Cualquier nuevo documento de negocio, arquitectura, QA, monetizacion, despliegue o soporte.

## Flujo recomendado

1. Crear o modificar el documento en el repositorio.
2. Ejecutar pruebas relevantes.
3. Hacer commit descriptivo.
4. Subir a GitHub.
5. Subir o reemplazar la copia correspondiente en Drive.
6. Registrar el cambio en `CHANGELOG.md`.

## Convencion de carpeta Drive

Dentro de `ScamShield_Transfer_Risk`, usar:

- `09_DOCUMENTATION`: PRD, arquitectura, despliegue, monetizacion y handoff.
- `10_DEVELOPMENT_HISTORY`: changelog, historial de commits, notas de implementacion y ZIPs entregables.

## Estado actual

La version monetizable del aplicativo esta subida a GitHub en `main`.

La carpeta Drive debe contener una copia de los documentos y del ZIP operativo generado desde `outputs/scamshield-transfer-risk.zip`.

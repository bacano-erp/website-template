# REST API como respaldo

Usar REST solamente cuando el usuario autorice crear un snapshot y el MCP
oficial/Desktop/Bridge no estén disponibles. REST entrega datos más crudos y no
reemplaza el contexto preparado por `get_design_context`.

## Autenticación

Figma admite OAuth y personal access tokens. Para una tarea local controlada,
inyectar el token mediante el entorno del proceso:

```bash
export FIGMA_ACCESS_TOKEN="..."
```

No escribirlo en `.env` versionado, argumentos de terminal persistidos,
manifiestos, código cliente, capturas o registros. `doctor` informa únicamente
si la variable existe; nunca lee ni muestra su valor.

## Extracción responsable

1. Obtener el file key desde el enlace autorizado.
2. Consultar solo páginas/nodos necesarios.
3. Registrar versión/fecha del archivo en el snapshot.
4. Descargar imágenes/assets una vez y conservar su procedencia.
5. Respetar `429` y encabezados de espera; no crear reintentos agresivos.
6. No guardar el JSON completo si contiene páginas ajenas al alcance.

El snapshot resultante debe seguir `extraction-contract.md`. Nunca incluir el
token ni URLs firmadas temporales como contrato permanente.

Fuentes oficiales:

- https://developers.figma.com/docs/rest-api/authentication/
- https://developers.figma.com/docs/rest-api/rate-limits/

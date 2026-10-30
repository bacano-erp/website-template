# Contrato de extracción normalizado

Cada fuente Figma debe producir el mismo checkpoint para que cambiar de MCP a
Desktop o REST no obligue a rehacer la implementación.

## Estructura sugerida

```text
.bacano/designs/<proyecto>/
├── manifest.json
├── tokens.json
├── content-blueprint.json
├── fixtures/
├── assets/
└── screenshots/
```

`content-blueprint.json` y `fixtures/` son necesarios únicamente cuando el
diseño contiene información editorial que todavía no existe o no está lista en
Bacano. Su contrato se define en
[content-workflow.md](content-workflow.md). No crear fixtures para catálogo,
precios, inventario, checkout, identidad ni otras fuentes funcionales del SDK.

No modificar `.gitignore` automáticamente. Preguntar o seguir la política del
proyecto antes de versionar imágenes o archivos grandes.

Una política opcional, sin secretos, puede guardarse en
`.bacano/designs/config.json`:

```json
{
  "preferredSource": "figma-official",
  "fallbackSources": [
    "figma-desktop",
    "desktop-bridge",
    "rest-snapshot"
  ],
  "fallbackMode": "ask",
  "reuseCachedExtraction": true
}
```

`fallbackMode` debe ser `ask` por defecto. Usar `auto` únicamente cuando el
usuario haya autorizado expresamente todas las fuentes declaradas.

## Manifiesto mínimo

```json
{
  "schemaVersion": 1,
  "project": "mi-storefront",
  "source": {
    "adapter": "figma-official",
    "fileKey": "opcional",
    "fileVersion": "opcional",
    "extractedAt": "2026-08-24T12:00:00.000Z"
  },
  "capabilities": {
    "variables": "partial",
    "components": "available",
    "autoLayout": "available",
    "responsiveFrames": "partial",
    "interactions": "partial"
  },
  "pages": [
    {
      "route": "/",
      "name": "Home",
      "status": "extracted",
      "desktop": { "nodeId": "1:2", "url": "https://figma.com/..." },
      "mobile": { "nodeId": "1:3", "url": "https://figma.com/..." }
    }
  ],
  "assumptions": []
}
```

Valores de `adapter`:

- `figma-official`: MCP remoto oficial.
- `figma-desktop`: MCP local oficial.
- `desktop-bridge`: bridge comunitario.
- `rest-snapshot`: REST autorizado.

Capacidades: `available`, `partial` o `missing`.
Estado de página: `pending`, `extracted`, `implemented` o `validated`.

Cada página requiere `route`, `name`, `status` y al menos un frame desktop o
mobile con `nodeId` o `url`. No guardar secretos ni respuestas MCP completas.
Antes de implementar, comprobar que las rutas no apuntan accidentalmente al
mismo frame o `nodeId`. Una reutilización intencional debe quedar registrada en
`assumptions`.

## Estrategia de consultas

- Obtener metadata suficiente para construir el mapa de páginas.
- Extraer cada frame principal una vez.
- Solicitar subnodos solo si el contexto principal es incompleto.
- Reutilizar tokens/assets comunes entre páginas.
- Al reanudar, comparar `fileVersion` y repetir únicamente nodos cambiados.
- Conservar las inferencias en `assumptions` para revisión humana.

Para sitios medianos, una extracción organizada suele requerir decenas de
lecturas, no una consulta por cada capa. La cifra exacta depende de la calidad y
estructura del archivo, no únicamente del número de páginas.

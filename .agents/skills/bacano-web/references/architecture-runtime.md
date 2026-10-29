# Arquitectura SDK y tráfico runtime

Usar este control en toda web construida con `@bacano/sdk`. Clasificar primero
estas seis capacidades, antes de evaluar si su implementación es correcta:

| Capacidad | Estado permitido |
| --- | --- |
| Catálogo estático | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |
| Precio y disponibilidad dinámicos | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |
| Configuración pública del website | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |
| Vista previa editorial | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |
| Marketing y analítica | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |
| Funciones transaccionales | `ACTIVA`, `INACTIVA` o `BLOQUEADA` |

`INACTIVA` significa que la capacidad está apagada intencionalmente y no hace
parte del lanzamiento. `BLOQUEADA` significa que el sitio pretende usarla, pero
falta contrato, configuración o una dependencia necesaria. El resultado de una
prueba se informa aparte como aprobado, fallido o no verificado.

## Static First

Contrastar siempre con `STOREFRONT_PERFORMANCE.md`.

- Inventariar qué datos nacen en build/servidor y cuáles cambian en runtime.
- Verificar que catálogo, Content, metadata, rutas, sitemap y JSON-LD se
  materialicen estáticamente cuando corresponda.
- Inspeccionar el HTML exportado directamente. No aceptar una página que solo
  obtiene contenido después de hidratar.
- Confirmar un único `BacanoProvider` y un único `BacanoClient` por árbol de
  ejecución. No crear clientes por módulo, hook, ruta o vista previa.
- Si `public-config` se obtuvo en servidor o build, derivar el contexto con
  `getWebsiteContextFromPublicConfig()` y entregarlo como `initialContext`.
- No resolver repetidamente el website ni descargar en el navegador productos
  completos que ya están en el snapshot.
- Actualizar en runtime solo datos volátiles mediante el contrato oficial:
  precio, disponibilidad y `maxPurchasableQuantity`.
- Agrupar IDs, eliminar duplicados y usar caché/debounce razonables. Respetar el
  máximo documentado por solicitud y conservar el snapshot si falla el refresh.
- Filtros o paginación dinámicos pueden consultar estructura únicamente cuando
  el diseño publicado lo requiere. Deben usar el SDK y no repetir la descarga
  inicial sin una interacción que lo justifique.
- No aceptar GraphQL directo, endpoints internos, clientes paralelos ni reglas
  locales que reconstruyan catálogo, inventario o precios.

## Trace real del navegador

Cuando exista una aplicación ejecutable o un dominio, capturar la red en un
contexto limpio y registrar por fase:

1. carga inicial directa;
2. navegación interna;
3. filtro, orden o paginación;
4. apertura de un detalle representativo.

Para cada operación GraphQL registrar `operationName`, cantidad, fase,
iniciador, código HTTP y tipo de datos solicitado. Comparar payloads para
detectar la misma operación con las mismas variables. Una repetición sin nueva
interacción, invalidación o cambio de datos es un duplicado; una revalidación
documentada no lo es.

El informe debe indicar:

- número de instancias del cliente;
- cantidad y nombres de operaciones en la carga inicial;
- operaciones duplicadas y causa;
- datos provenientes del HTML/snapshot;
- datos actualizados en runtime;
- conclusión explícita sobre Static First.

Si no hay navegador disponible, marcar el trace `🧪 NO VERIFICADO`; no inferir
la ausencia de tráfico solo desde el código.

## Vista previa editorial

Contrastar siempre con `STOREFRONT_PREVIEW.md`. Si está activa, validar:

- una única ruta pública, preferiblemente `/vista-previa/`;
- `BacanoPreviewShell` desde `@bacano/sdk/react/preview`;
- el mismo provider y cliente global del storefront;
- una allowlist finita de rutas editoriales;
- exclusión de checkout, pagos, cuenta, pedidos y demás rutas transaccionales;
- los mismos componentes y mappers usados en producción;
- `noindex, nofollow` y ausencia total del sitemap;
- carrito, popups, chat y elementos comerciales globales ocultos;
- ausencia de scripts y requests efectivos de GA4, Meta, Clarity u otros
  proveedores al cargar directamente preview;
- cero eventos de marketing durante navegación, refresh y errores de preview;
- estados SDK `idle`, `loading`, `ready` y `error`;
- resultados visuales `missing` y `unsupported` definidos por el storefront;
- reintento, refresh forzado, caché y navegación interna;
- contenido publicado únicamente, mientras el SDK no soporte borradores.

Activar preview no puede volver dinámica toda la web pública.

## Verificaciones automatizables

Automatizar cuando sea razonable:

- HTML estático con contenido y enlaces reales;
- conteo de providers/clientes mediante pruebas de integración;
- inventario de requests GraphQL sin duplicados;
- batching, caché y error del estado vivo;
- `noindex, nofollow` y exclusión del sitemap;
- ausencia de marketing en preview;
- allowlist y bloqueo de rutas transaccionales;
- estados, refresh y caché de preview.

No reemplazar un contrato faltante con GraphQL o API directa. Registrarlo como
brecha del SDK, con evidencia y prueba de aceptación propuesta.

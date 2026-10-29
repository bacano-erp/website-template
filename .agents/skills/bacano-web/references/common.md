# Controles comunes

Aplicar `P0` solo a capacidades publicadas o comprometidas para el lanzamiento.
Usar `P1` para calidad profesional y `P2` para evolución. No convertir una
función apagada en un bloqueo artificial.

## Repositorio y arquitectura

- Confirmar rama, estado de Git, lockfile y versión instalada del SDK.
- Identificar framework, modo estático/híbrido/SSR, hosting y dominio canónico.
- Verificar un único cliente/provider de Bacano y ausencia de GraphQL directo.
- Si el sitio admite modo construcción, verificar `BacanoWebsiteGate` por fuera
  de auth y marketing, fallback estático `<noscript>`, actualización en runtime
  y vista previa temporal.
- Confirmar que fallos de Content, marketing o servicios externos degradan sin
  vaciar la página ni bloquear navegación.
- Ejecutar los controles definidos por el proyecto: instalación reproducible,
  typecheck, lint, pruebas, E2E disponibles y build de producción.

## Rutas y contenido

- Inventariar rutas desde sitemap, export estático y router; no depender de una
  muestra manual arbitraria.
- Comparar rutas declaradas, páginas generadas y URLs del sitemap. Explicar
  cualquier diferencia y fallar si el build omite contenido público de forma
  silenciosa.
- Verificar HTTP, errores de consola, excepciones, recursos fallidos, enlaces
  internos, 404, redirecciones y canonical.
- Comprobar que preview, callbacks, cuenta, checkout y respuestas de pago no se
  indexen cuando corresponda.
- Validar estados vacío, loading, error y ausencia de Content opcional.
- `P0`: toda región visual cuya fuente sea un `ContentEntry` expone en el HTML
  final el marcador de `STOREFRONT_CONTENT_LOCATOR.md`, con la key, nombre y
  locale de la entrada fuente. El control es por entrada completa, no por campo.
- Comparar inventario de entradas y regiones. Permitir marcadores repetidos si
  una entrada aparece en varios lugares y marcadores anidados cuando una tarjeta
  proviene de otra entrada referenciada. No exigirlos a código/i18n, catálogo,
  `publicConfig` ni documentos legales.

## SEO y compartición

- Título, descripción, canonical, robots, Open Graph y Twitter por ruta.
- Conservar los campos SEO editados de verdad en Bacano, pero no publicar
  `lorem ipsum` u otros borradores visibles como metadata. Usar fallbacks
  específicos para cada página y evitar duplicar la marca en el título.
- `robots.txt`, sitemap con URLs canónicas y ausencia de rutas privadas.
- En el dominio publicado, comprobar con `GET` el código, tipo de contenido y
  política de caché de sitemap y robots. Las rutas estables de descubrimiento
  no deben heredar `immutable` de los assets versionados; contrastar un error
  de Search Console con su prueba en tiempo real antes de culpar al XML. Ver
  `STOREFRONT_PERFORMANCE.md`.
- Jerarquía de encabezados, idioma, texto alternativo, enlaces internos y
  JSON-LD coherente con el contenido visible.
- Confirmar 404 real, canonical único, ausencia de slugs/URLs duplicadas y
  redirección consistente entre `www`, dominio raíz y HTTP/HTTPS.
- El host del sitemap, canonical, Open Graph y redirección final debe coincidir;
  no basta con que cada URL funcione por separado.
- Usar `hreflang` solo cuando existan versiones regionales o de idioma reales.
- Favicon, iconos, manifest y vista previa al compartir.

## Rendimiento y media

- HTML inicial útil; no publicar únicamente skeletons.
- Imágenes con dimensiones, `srcset`, `sizes`, formatos optimizados y lazy load
  bajo el pliegue. No construir transformaciones de Storage manualmente.
- Revisar desktop y mobile, DPR 1/2, CLS, LCP, fuentes y JavaScript inicial.
  Tratar una medición sintética aislada como diagnóstico, no como verdad de
  campo; repetir y distinguir regresión sostenida de ruido.
- En carruseles, contar imágenes descargadas, no solo elementos visibles;
  comprobar navegación a fotos lejanas y compatibilidad con los navegadores
  móviles soportados. Ver `STOREFRONT_PERFORMANCE.md`.
- Confirmar caché y CORS/CORP de media pública sin proxies locales.

## Accesibilidad y experiencia

- Navegación por teclado, foco visible, landmarks, labels, contraste y zoom.
- Formularios con errores específicos, estados de envío y prevención de doble
  envío. No usar solo color para comunicar estado.
- En formularios propios del storefront, verificar Zod en dependencias **y** en
  el código que valida antes del envío; comprobar pruebas para valores válidos,
  inválidos y corrección del error. Si falta, registrar `P1 · Calidad`; si un
  dato inválido llega a checkout o impide comprar, evaluar además el flujo como
  `P0 · Gate`. No exigir un esquema Zod paralelo a `BacanoForm`.
- Probar anchos móviles, tablet y escritorio sin scroll interno accidental.

## Legal y privacidad

- Consumir términos, envíos, cambios/devoluciones, privacidad y cookies desde
  `publicConfig.legal`, manejando documentos nulos.
- No duplicar documentos legales en Content o en constantes del storefront.
- Mostrar el aviso informativo solo si Bacano lo activa y no presentarlo como
  gestor de consentimiento.
- No exponer PII, tokens, secretos ni identificadores internos en URL, HTML,
  logs, eventos o almacenamiento inseguro.
- Detectar placeholders visibles, texto de ejemplo y datos legales incompletos.
  Un documento publicado con marcadores como `[RAZÓN SOCIAL]` es un `P0`.

## Seguridad y terceros

- HTTPS, HSTS cuando aplique, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` y CSP efectiva.
- Construir CSP solo con proveedores realmente activos. Revisar la matriz
  canónica de `STOREFRONT_MARKETING.md`.
- No usar `unsafe-eval`, comodines arbitrarios ni secretos públicos.
- Confirmar que CSP no bloquee Clerk, pagos, GA4, Meta o Clarity habilitados.
- Confirmar que la pantalla de construcción no se presente como seguridad ni
  permita que contenido privado forme parte del export estático.

## Operación

- Validar dominio canónico, redirects, DNS, SSL, variables de producción y
  rollback.
- Confirmar monitoreo de errores y logs sin datos personales.
- Registrar fecha, ambiente, versión/commit y qué pruebas requieren cuentas o
  acciones externas para completarse.
- Verificar que el equipo conoce qué cambios requieren rebuild/despliegue y que
  existe un mecanismo reproducible para ejecutarlo y revertirlo.

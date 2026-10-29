# Checklist de web informativa

Aplicar además de los controles comunes.

## Contenido y navegación

- Home, páginas institucionales, servicios, blog, contacto y legales cargan
  contenido real y conservan rutas estables.
- Menú, footer, breadcrumbs y enlaces de Content no apuntan a borradores o 404.
- Preview usa `@bacano/sdk/react/preview`, muestra solo contenido publicado,
  permanece `noindex` y no dispara marketing.

## Formularios y contacto

- Los formularios administrados desde Bacano cumplen
  [forms.md](forms.md), usan el renderer o hook oficial y conservan su definición
  estática cuando corresponde.
- Distinguir formularios informativos/PQRS de capturas comerciales.
- Newsletter, cupón o interés comercial usan
  `client.marketing.captureLead()` y el texto vigente de autorización.
- Formularios generales tienen destino, antispam/rate limit, idempotencia y
  mensaje de recepción sin promesas falsas.
- WhatsApp, teléfono y email emiten `contact` con ubicación canónica cuando
  marketing está activo.

## Medición

- Una sola fuente de `page_view` para navegación inicial y SPA.
- Medir contacto, formularios y navegación relevante sin inventar ecommerce.
- GA4, Meta y Clarity cargan solo en dominio canónico y nunca en preview/local.
- No exigir catálogo, carrito, checkout, métodos de entrega, pagos ni eventos
  ecommerce a esta clase de sitio.

## Cierre mínimo

- Probar cada formulario sin crear registros duplicados.
- Verificar entrega o persistencia real cuando el formulario sea esencial.
- Comprobar páginas principales y legales en desktop/mobile.
- Validar indexación, performance y consola en todas las rutas publicadas.
- Marcar autenticación, leads o medición como `➖ NO APLICA` cuando estén
  realmente apagados; si están visibles, aplicar sus contratos y pruebas de
  cierre.

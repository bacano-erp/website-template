# Mapeo de Figma a Bacano

Figma decide presentación. Bacano decide datos, permisos, estados y reglas de
negocio.

## Matriz obligatoria

Antes de programar, registrar por ruta:

| Ruta | Frame | Componente | Fuente | Content | Localizador | Responsive | Preview | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Home desktop/mobile | `Hero` | Content | `hero_inicio` | entrada V1 | 2 frames | activa | pendiente |

Fuentes posibles: Content, catálogo estático, live state, public config,
checkout, auth u otra operación documentada del SDK.

## Reglas

- Usar componentes y tokens existentes antes de crear otros.
- Mapear textos/imágenes editoriales a Content cuando deban ser administrables.
- Para cada fuente `ContentEntry`, conservar y renderizar el marcador de entrada
  definido en `STOREFRONT_CONTENT_LOCATOR.md`; no bajar a nivel de campo.
- Si el equipo de Content y desarrollo trabajan en tiempos distintos, seguir
  [content-workflow.md](content-workflow.md) y mantener un único contrato de
  datos entre fixtures temporales y Bacano real.
- Usar `responsiveSources` y helpers oficiales para media; no construir URLs de
  Storage manualmente.
- Mantener HTML semántico, canonical, metadata, JSON-LD y sitemap.
- En tiendas, conservar rutas de producto y `product_variant_id` definidos por
  el contrato del SDK.
- La estructura del catálogo puede venir del build; precio, disponibilidad y
  límites se actualizan con live state/cart oficial.
- Montar proveedores globales una sola vez.
- Preview reutiliza los mismos componentes y cliente; no crear un storefront
  paralelo para “parecerse” a Figma.
- Marketing se emite mediante el runtime/hook oficial, nunca desde clicks
  duplicados escritos solo para una página.

Si el SDK no ofrece una capacidad, documentar la brecha. No llamar GraphQL o
endpoints internos como workaround.

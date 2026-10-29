# Piezas de fábrica

Tres piezas que todo sitio Bacano necesita y que la plantilla ya trae
montadas. Ninguna se configura en este repositorio: se encienden y se manejan
desde Bacano.

## Vista previa (`/vista-previa/`)

Deja ver el contenido de Bacano **antes de publicarlo**, con las mismas vistas
del sitio real.

- La página está en `src/app/vista-previa/` y la arma
  `src/components/StorefrontPreview.tsx` con `BacanoPreviewShell` del SDK.
- Renderiza las mismas vistas de `src/views/` que las páginas publicadas. Por eso
  una página nueva previsualizable tiene su vista en `src/views/` y su ruta en
  `src/features/preview/routes.ts`: si la vista vive dentro de la página, la
  vista previa no la puede mostrar.
- Va en el mismo `out/`, pero CloudFront la oculta en el dominio del cliente y
  exige una sesión firmada en el host de vista previa. Además lleva
  `noindex, nofollow`.

Guía completa: `STOREFRONT_PREVIEW.md` del SDK.

## Localizador de Content

La extensión de Chrome *Bacano Content Locator* señala una región del sitio y
abre directamente la entrada de Content que la escribe. Solo funciona si la
región está marcada.

- Toda región cuyo contenido sale de una entrada de Content se envuelve en
  `ContentEntrySection` (`src/components/content/ContentEntrySection.tsx`),
  que pone los cuatro atributos `data-bacano-*`.
- Se marca el bloque una vez (sección, banner, tarjeta), no su título ni su
  botón. Una tarjeta que sale de otra entrada lleva su propia sección anidada.
- No se marcan productos del catálogo, documentos legales ni textos propios del
  código: no son Content.

Una región sin marcar se ve igual, y la extensión simplemente no encuentra nada.
La skill `bacano-web` lo revisa en su auditoría.

Guía completa: `STOREFRONT_CONTENT_LOCATOR.md` del SDK.

## Sitio en construcción

Bacano puede ocultar un sitio publicado con una pantalla de construcción, sin
volver a hacer el build.

- `BacanoWebsiteGate` envuelve todo en `src/app/providers.tsx`, **por fuera** de
  Clerk y del SDK: con la pantalla activa no se carga nada más, ni cuentas ni
  medición.
- Mientras el gate confirma la configuración, el HTML exportado conserva el
  catálogo dentro de un `<noscript>`: los visitantes sin JavaScript y los
  crawlers siguen viendo la tienda.
- Si la configuración no responde, el sitio abre. Nunca se cae por esto.
- Localhost y los orígenes de desarrollo nunca quedan bloqueados.
- Para revisar el sitio con la pantalla activa, Bacano genera un enlace temporal
  (`#bacano-preview=…`) que dura dos horas.

Las pruebas en `tests/e2e/website-gate.spec.ts` comprueban los tres casos:
apagado, encendido y el HTML sin JavaScript.

Guía completa: `STOREFRONT_CONSTRUCTION.md` del SDK.

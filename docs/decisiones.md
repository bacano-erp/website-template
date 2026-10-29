# Decisiones adoptadas

Varios sitios en producción construidos sobre Bacano tomaron estas decisiones
después de algún problema real. La plantilla las adopta para que un sitio nuevo
no las tenga que redescubrir.

## Imágenes sin `Referer`

Toda `<Image>` o `<img>` lleva `referrerPolicy="no-referrer"`. El storage de
Bacano rechaza un `Referer` que no reconoce (localhost, el host de vista
previa) y el navegador bloquea la respuesta: la imagen funciona en producción y
desaparece justo donde se construye y se revisa el sitio.
`tests/unit/image-referrer.spec.ts` falla si una imagen no lo declara.

## Sin contenido inventado

Si Content no responde en el build, el build falla. No hay textos ni banners de
reemplazo locales: un sustituto silencioso publica un sitio con contenido que
nadie escribió, y el deploy sale en verde. Una entrada publicada pero incompleta
se oculta en lugar de mostrarse a medias.

## Legales desde la configuración pública

Términos, privacidad, cookies, envíos y devoluciones salen de la configuración
pública del website a través del SDK (`STOREFRONT_LEGAL.md`), no de Content ni
de textos en el código. Un documento que falta muestra un estado vacío, lleva
`noindex` y no entra al sitemap.

## Una consulta de Content por página

Una página arma sus secciones con una lectura por categoría
(`client.content.getByCategory(...)`) y las ordena y valida con un mapper. Los
componentes reciben propiedades tipadas y no consultan el SDK. Muchas lecturas
sueltas por entrada son la forma más rápida de llegar al límite de solicitudes.

## Páginas delgadas

`page.tsx` recibe los parámetros, carga datos, compone vistas y exporta la
metadata. El marcado vive en `src/views/` (también lo usa la vista previa) y la
lógica en `src/lib/` o `src/features/`. Una página que pasa de unas 150 líneas
se separa.

## Rutas privadas fuera de los buscadores

Carrito, checkout, pedido y respuesta de pago no entran al sitemap, llevan
`noindex` y las dos primeras están excluidas en `robots.txt`.

## Rendimiento

- La primera imagen grande (el hero) va en el HTML con prioridad alta. Las demás
  se cargan después.
- Estilos y componentes pesados se cargan donde se usan, no desde un índice
  común que los arrastre a todas las páginas.

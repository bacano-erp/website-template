# Checklist de tienda virtual

Aplicar además de los controles comunes.

## P0 · Publicación y cobertura del catálogo

- Generar rutas, HTML, metadata, sitemap y JSON-LD desde un único
  `getStaticCatalogBootstrap()`; no consultar un producto por ruta durante el
  mismo build.
- Comparar `bootstrap.total`, productos únicos del snapshot, rutas de producto
  generadas, URLs de producto del sitemap y páginas del export. Toda diferencia
  debe ser intencional y explicable; el límite configurado no puede truncar el
  catálogo silenciosamente.
- Hacer fallar el build de producción si el snapshot está vacío, incompleto o
  no corresponde al website esperado. Los placeholders solo sirven en local.
- Usar `/producto/{slug}` como ruta canónica cuando el proyecto adopte ese
  contrato; la variante publicitaria usa `?variant={product_variant_id}` sin
  alterar canonical.
- Precio, SKU, stock, variante seleccionada, JSON-LD, carrito, WhatsApp y
  eventos deben referirse a la misma variante.
- Verificar la regla de **productos agotados** del website y las excepciones
  por producto y por web. La regla predeterminada oculta agotados; una excepción
  `true` los muestra, `false` los oculta y `null` hereda la regla. La publicación
  del producto, cadena activa y precio público siguen siendo requisitos. El
  SDK aplica la visibilidad en catálogo, rutas, SEO, filtros, recomendaciones y
  búsqueda: la tienda no debe duplicar ese filtrado ni consultar Hasura.
- Un producto agotado visible no es comprable: comprobar `inStock: false` y
  `maxPurchasableQuantity: 0` en estado vivo, controles de cantidad y checkout.
  `getProducts({ inStock: true })` debe seguir excluyéndolo. Si el sitio es
  estático, cambiar esta regla exige rebuild para que rutas, sitemap y HTML
  reflejen los productos ahora visibles u ocultos.
- El HTML inicial debe contener producto, precio y enlaces reales sin depender
  de JavaScript. Después de hidratar, refrescar únicamente estado volátil por
  lotes con `getProductLiveState()` y respetar `maxPurchasableQuantity`.
- Si el refresh vivo falla, conservar el snapshot sin vaciar ni bloquear la
  página. Al mismo tiempo, checkout debe revalidar autoritativamente precio y
  stock ante concurrencia.
- Verificar el comportamiento cuando una variante queda agotada, cambia de
  precio o limita cantidad entre build y compra.
- Definir cómo se dispara un rebuild al publicar, retirar, renombrar o cambiar
  imágenes/descripción. El refresh vivo no reemplaza esa actualización
  editorial del snapshot.
- Recomendaciones y relacionados no bloquean el contenido principal.

## P0 · SEO comercial

- Cada producto público tiene título, descripción, canonical, Open Graph,
  imagen compartible y JSON-LD `Product` coherente con la variante visible.
- Sitemap contiene cada slug canónico una sola vez y excluye UUID, query de
  variante, preview, checkout, cuenta, pedido y respuesta de pago.
- La ruta elegida desde feed, anuncio, tarjeta, relacionado y carrito resuelve
  el mismo producto; URLs antiguas importantes redirigen o se documentan.
- Producto retirado responde 404/410 o se reconstruye dentro del SLA definido;
  nunca queda comprable solo por existir en un export viejo.

## Carrito y checkout

- Carrito invitado persiste y sincroniza sin duplicar líneas.
- Separar en un trace frío y otro con sesión existente el tiempo hasta feedback
  visible, carrito confirmado, totales útiles y formulario de checkout. Anotar
  operaciones, duración y dependencias en serie; repetir en móvil y conexión
  lenta. Un total “lento” sin desglose no identifica al responsable.
- Comprobar que crear la primera línea use las respuestas completas de
  `getOrCreate` y `setItem` sin un GET adicional; cambios de cantidad no deben
  rehacer toda la sincronización ni repetir lecturas de configuración ajenas a
  la mutación. Mantener una sola fuente de estado confirmado y serializar
  escrituras rápidas.
- El drawer debe abrirse con feedback inmediato, pero no presentar un total
  provisional como confirmado. Mientras Bacano responde, conservar el último
  snapshot, mostrar progreso en la línea afectada y permitir recuperación
  visible ante error; no bloquear todas las tarjetas por una sola operación.
- Si el host sirve un export estático, probar la navegación a checkout en el
  dominio publicado: verificar tipo de respuesta de las solicitudes del
  router, documento final y persistencia del carrito. Un `200` de HTML para una
  solicitud RSC no equivale a navegación correcta; usar navegación de documento
  cuando el host no sirve RSC. Cubrir escritorio y móvil.
- Precargas de entrega/pago deben deduplicarse y no bloquear la mutación ni el
  enlace a checkout; no repetirlas tras cada cambio de cantidad. Nunca usar
  una caché de opciones para precio final, stock, cotización de envío o carrito.
- Los campos propios de checkout se validan con Zod antes de llamar al SDK.
  Inspeccionar el esquema, el punto de envío y pruebas de errores por campo:
  tener Zod instalado o usar solo `type="email"`/`required` no basta. El SDK y
  Bacano mantienen la validación autoritativa; la web no inventa reglas de pago.
- Si una operación bloquea temporalmente otras mutaciones del carrito, mostrar
  el indicador de carga en el producto accionado, no en todas las tarjetas.
- Si hay autoguardado, no crear un pedido con datos de contacto parciales.
  Validar los campos requeridos por ese checkout y probar escritura rápida del
  teléfono/correo: una intención de compra mantiene un `orderId` estable.
- Serializar los inicios de checkout que pueden solaparse (autoguardado, cupón,
  envío y botón final). Confirmar en un trace que el segundo usa el token
  entregado por el primero; no asumir que un debounce evita todas las carreras.
- Probar alta, baja, cambios de cantidad, límites de stock, cupón, envío gratis,
  impuestos, moneda y redondeo.
- Probar solo los modos activos entre COUNTER, PICKUP y SHIPPING; propia y
  transportadora cuando apliquen, incluyendo contraentrega y pagos parciales.
- Verificar errores accionables, idempotencia y doble clic/reintento.
- Nunca inventar reglas de ventas o estados en el storefront.

## Pagos y pedidos

- Leer y aplicar `STOREFRONT_PAYMENTS.md`; no reconstruir en la tienda URLs,
  credenciales ni payloads privados de Wompi, Mercado Pago o Addi.
- Si se muestran marcas de pasarela o redes, comprobar que corresponden al
  método efectivamente devuelto por Bacano y no sugieren un método adicional
  ni un medio que el checkout alojado no tenga confirmado.
- Ejecutar al menos un happy path real o sandbox por cada método crítico
  publicado. Probar pago inmediato, transferencia, Wompi y contraentrega solo
  si están activos; los estados alternos de cada proveedor quedan en su matriz
  de riesgo.
- La página de respuesta no emite `purchase`; Bacano lo hace desde hechos
  autoritativos. Repetir webhook/conciliación no duplica conversiones.
- Después de abrir la pasarela, comprobar que el storefront conserva el enlace
  al pedido pero no un carrito local que cree otro pedido al volver. Ante un
  rechazo con sesión todavía `pending`, la respuesta debe ofrecer
  `RETRY_PAYMENT` en el mismo pedido; nunca inferir aprobación o rechazo solo
  del retorno del navegador.
- Pedido, pago, entrega y desembolso permanecen conceptos separados.
- Probar consulta pública segura y cuenta autenticada sin filtrar pedidos de
  otra persona, website o canal.

## Autenticación

- Clerk posee registro, inicio de sesión, recuperación, verificación y sesión.
- Una aplicación Clerk por website; solo publishable key en navegador.
- Un `BacanoProvider` recibe `getAccessToken`; no se captura ni guarda el token.
- Si las cuentas están activas o se anuncian, probar registro/inicio y el flujo
  principal autenticado; recuperación, verificación, perfil, direcciones y
  pedidos se clasifican según lo publicado. Clerk no rompe checkout invitado.
- Si las cuentas están apagadas, todas estas pruebas son `➖ NO APLICA`.

## Marketing y catálogos publicitarios

- Instrumentar únicamente con `useMarketing().track()` después del éxito.
- `product_variant_id` es `itemId`; `order_id` es `transaction_id`.
- Auditar `view_item_list`, `select_item`, `view_item`, carrito, checkout y
  contactos; conversiones autoritativas nunca salen del navegador.
- Primera y última fuente no directa sobreviven navegación interna y quedan
  congeladas en el pedido.
- Probar un enlace de anuncio real con `utm_source`, `utm_medium`,
  `utm_campaign` y, si aplica, `utm_content`: confirmar que la URL final tras
  redirecciones conserva las etiquetas; distinguir `fbclid` de las UTM.
- En una SPA, comprobar que el provider captura la entrada antes de limpiar la
  URL, que un cambio de ruta sin parámetros no sustituye la última campaña por
  un `referrer` antiguo, y que otra URL etiquetada sí actualiza la última
  interacción sin borrar la primera.
- Verificar `marketing.getAttribution()` en `cart.startCheckout()` y en la
  actualización del mismo pedido; comparar primera/última UTM persistidas en
  Bacano y visibles en carritos abandonados. El origen comercial puede diferir
  de ambas y no debe presentarse como UTM cruda.
- Confirmar la recepción de `AddToCart` en Meta por separado: un evento de
  pixel/CAPI no demuestra que Bacano recibió UTM ni que Ads Manager use la
  misma regla de atribución que el origen comercial de Bacano.
- Feeds Meta/Google usan la misma variante, ruta, precio y disponibilidad que
  la landing. Probar URLs del feed y productos omitidos.
- GA4, Meta, Clarity, leads y feeds se auditan únicamente si están activos.
  Cada proveedor activo debe demostrar al menos una recepción real antes de
  declarar esa capacidad lista, sin convertir su caída en bloqueo de compra.

## P1 · Calidad profesional

- Media responsive con dimensiones, `srcset`, `sizes`, carga prioritaria solo
  para LCP y lazy loading bajo el pliegue; sin transformaciones manuales.
- Catálogo, filtros y carrito conservan contenido útil durante errores
  transitorios y no producen saltos de layout evitables.
- JSON-LD, feed publicitario y estado vivo no contradicen precio, moneda,
  disponibilidad ni variante mostrados.
- La generación es reproducible con lockfile y deja evidencia de conteos,
  snapshot, duración y artefacto.

## P2 · Evolución

- Datos de campo de Core Web Vitals, pruebas sintéticas periódicas, monitoreo de
  enlaces rotos y alertas de divergencia entre feed, sitemap y catálogo.
- Matrices exhaustivas de estados no críticos, navegadores adicionales y
  automatización de rebuild según el hosting.

## Cierre transaccional

- Ejecutar al menos una compra real o sandbox por método crítico activo.
- Confirmar pedido en Bacano, estado económico, inventario, envío y correo.
- Confirmar GA4/Meta del embudo y conversión sin duplicados.
- Si un flujo activo esencial no se ejecutó, marcarlo `🧪 NO VERIFICADO`, no
  `APROBADO`; el dictamen es `🟠 INCOMPLETO` salvo que exista además un fallo
  probado.

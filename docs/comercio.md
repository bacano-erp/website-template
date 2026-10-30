# Comercio: carrito, checkout, pago y pedido

La tienda trae el flujo de compra completo, construido a partir de las tiendas
que ya venden en producción sobre Bacano. Todo vive en `src/features/commerce/`
y usa el SDK; los precios, medios de pago, envíos, cupones y puntos de retiro
salen de Bacano, nunca del código.

## El recorrido

1. **Producto.** `AddToCart` consulta el stock en vivo y agrega la variante al
   carrito local. Se abre el panel lateral (`CartDrawer`).
2. **Carrito.** Vive en el navegador (`cart/local-cart.ts`) hasta que el
   checkout tiene un contacto. Navegar y agregar productos no crea nada en
   Bacano, así que no quedan carritos vacíos en la plataforma por cada visita.
   El panel muestra el progreso hacia el envío gratis y respeta la cantidad
   máxima que Bacano permite comprar de cada variante.
3. **Checkout** (`/checkout/`). En el teléfono va por pasos; en escritorio, en
   una sola página. Con el primer contacto válido, el carrito se envía a Bacano
   en una sola operación (`cart.startCheckout`) y desde ahí Bacano lo ve como
   carrito abandonado si la compra no termina. El checkout lee de Bacano:
   - opciones de entrega (`getDeliveryOptions`): envío o retiro, con sus
     nombres tal como están en la plataforma;
   - departamentos y municipios (`getLocationOptions`) y cotización del envío
     para la dirección (`getShippingQuotes`);
   - medios de pago según la entrega (`getPaymentOptions`), incluido el abono
     inicial cuando el medio lo exige;
   - cupones (`validateCoupon`, `applyCoupon`, `removeCoupon`).
4. **Pago.** Si el medio es una pasarela, se crea la sesión de pago
   (`createPaymentSession`) y el comprador sale a la pasarela. Contraentrega,
   transferencia o pago en tienda terminan directamente en la confirmación.
5. **Respuesta de pago** (`/pago/respuesta/`). Concilia la respuesta de la
   pasarela con Bacano y consulta el pedido hasta tener un veredicto. Decide con
   lo que Bacano dice que sigue (`payment.nextAction`), no con el texto que
   mandó la pasarela.
6. **Pedido** (`/pedido/?orderId=…&token=…`). El comprador ve su pedido con el
   enlace que recibe al comprar. Si Bacano permite reintentar el pago, se ofrece
   desde ahí.

## Lo que no se negocia en la respuesta de pago

Todo lo que pasa aquí puede ocurrir **después** de que el comprador pagó:

- Si la API no responde o rechaza la consulta, el veredicto es «en revisión»,
  nunca «falló». Que la API no conteste no dice nada sobre si el pago se cobró.
- Se deja de consultar tras tres fallos seguidos, en lugar de dejar al
  comprador mirando una espera de casi un minuto. Mientras Bacano responda que
  el pago está pendiente, sí se sigue esperando.
- Siempre hay una salida: «Ver mi pedido» y «Seguir comprando».
- Funciona sin `localStorage` (Safari en modo privado): se pierde la copia
  local, nunca la página.

`tests/e2e/payment-adverse.spec.ts` prueba cada uno de estos casos.

## Qué se configura dónde

| Qué | Dónde |
|---|---|
| Medios de pago, pasarelas, abonos | Bacano |
| Envíos, tarifas, envío gratis | Bacano |
| Retiro en tienda: nombre, dirección, horario | Bacano (punto de retiro) |
| Cupones | Bacano |
| Legales que se aceptan al pagar | Bacano (configuración legal del website) |
| Cuentas de comprador (Clerk) | Bacano: se activan por website |
| Nombre de la tienda, logo del checkout, WhatsApp de ayuda | `src/config/store.ts` |
| Colores | El tema de HeroUI en `src/app/globals.css` |

## Cambiar el aspecto

El carrito y el checkout usan solo los tokens del tema de HeroUI (`accent`,
`foreground`, `muted`, `border`, `surface`, `danger`, …) y las clases de
`src/app/commerce.css`. Para aplicar una marca se cambian las variables del
tema; no hace falta tocar los componentes.

## Medición

La tienda reporta al marketing del SDK: vista de página (`page_view`), agregar
y quitar del carrito (`add_to_cart`, `remove_from_cart`), ver carrito
(`view_cart`), iniciar checkout (`begin_checkout`), información de envío
(`add_shipping_info`), información de pago (`add_payment_info`) y contacto por
WhatsApp (`contact`). Nada se envía desde la vista previa. Los destinos (GA4,
Meta, Clarity) se configuran en Bacano. La compra no se reporta desde el
navegador: si la pasarela aprueba después de que el comprador cerró la
pestaña, un evento del navegador nunca saldría.

## Pendiente

`CheckoutView.tsx` todavía concentra el estado de todo el checkout (unas 1.300
líneas). Las piezas visuales ya están separadas; el siguiente paso es extraer
el estado en hooks por responsabilidad (contacto, entrega, pago), con pruebas.

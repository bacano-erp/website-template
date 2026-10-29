# El SDK de Bacano en esta plantilla

Todo pasa por `@bacano/sdk`. Nunca se consulta el GraphQL de Bacano
directamente: se rompe con cada cambio de esquema y se salta el modelo de
permisos. Si al SDK le falta algo, se le pide a Bacano que lo agregue.

## Cómo se inicia (ya resuelto)

No hay que crear clientes. La plantilla trae tres puntos de entrada y ninguno
más:

| Dónde | Qué usar | Para qué |
|---|---|---|
| Build (Server Components, `generateStaticParams`) | `getBuildClient()` de `src/lib/bacano.ts` | Catálogo, textos y precios de exhibición que quedan en el HTML |
| Componentes de React en el navegador | Hooks de `@bacano/sdk/react` (`useCart`, `useAvailability`, …) bajo el `BacanoProvider` de `src/app/providers.tsx` | Stock, carrito, checkout: todo lo que es de cada comprador |
| Fuera del flujo de React (efectos, handlers) | `getBrowserClient()` de `src/lib/bacano.ts` | Por ejemplo, la página de respuesta de pago |

Los dos clientes de `src/lib/bacano.ts` son únicos: se crean e inician una vez
y se reutilizan. `getBrowserClient()` no guarda un inicio fallido, para que un
corte de red no deje el cliente roto por el resto de la sesión.

## El límite de solicitudes

Un sitio que navega rápido puede recibir `Rate limit exceeded`. En los sitios
en producción las causas fueron siempre del sitio, no de Bacano:

- **Iniciar el cliente muchas veces.** Cada `createBacanoClient()` +
  `init()` resuelve el website otra vez. Por eso hay un solo cliente por lado.
- **Datos globales pedidos en cada página** (menú, popup de marketing, listas
  del catálogo) desde el layout o la metadata. En el build se piden una vez y se
  comparten. En el navegador, lo que no cambia entre páginas no se vuelve a
  pedir al navegar.
- **Una consulta por producto en el build.** Para generar muchas rutas se usa
  una sola lectura del catálogo (`client.catalog.getStaticCatalogBootstrap()`,
  que trae el catálogo, su primera página y sus filtros; ver
  `src/lib/static-catalog.ts`) y se indexa el resultado.

Antes de culpar al gateway, revisar si el sitio repite llamadas globales en el
layout, la metadata, los providers o los componentes del servidor.

## Qué es estático y qué es en vivo

| | Viene de | Se actualiza |
|---|---|---|
| Catálogo, textos, imágenes, categorías | El HTML del build | Al publicar |
| Precio de exhibición | El HTML del build | Al publicar |
| Stock | El navegador, en vivo | En cada visita |
| Carrito | El navegador, en vivo | En cada visita |
| Precio final | Validado por Bacano en el checkout | Al pagar |

Si quedar unas horas desactualizado puede costar plata o engañar al comprador,
se consulta en el navegador. Si no, va en el HTML.

## Actualizar el SDK

```bash
pnpm sdk:update
```

Actualiza el paquete **y** reinstala las skills de agente que vienen con él.
Hacer solo `pnpm add @bacano/sdk@latest` deja a los agentes leyendo las
instrucciones de la versión anterior; `pnpm verify` (y CI) lo detecta con
`pnpm check:skills` y falla hasta que se reinstalen.

El SDK sigue semver: un cambio de versión mayor trae cambios incompatibles y
hay que leer sus notas. Los sitios ya creados no reciben las actualizaciones de
la plantilla: cada uno se actualiza por su cuenta.

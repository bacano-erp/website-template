# Calidad de implementación desde Figma

Aplicar estas reglas al construir la interfaz. Son criterios de resultado, no
una obligación de usar una librería concreta.

## Responsive e inferencias

Si Figma no incluye un frame móvil, construir una adaptación mobile first y
registrarla como inferencia. Conservar jerarquía, contenido, orden semántico y
acciones principales; apilar columnas cuando corresponda y evitar overflow
horizontal. Verificar al menos móvil, tablet y escritorio.

No convertir automáticamente toda colección en carrusel. Usarlo únicamente
cuando mejore la exploración y asegurar scroll táctil, teclado, controles
accesibles, dimensiones estables y pausa durante la interacción. Respetar
`prefers-reduced-motion` cuando exista autoplay o movimiento.

## Componentes e interacción

Inspeccionar dependencias y componentes del proyecto antes de añadir paquetes.
No imponer HeroUI, Embla, Motion, CSS Modules u otra librería; reutilizar el
sistema existente y pedir autorización antes de introducir una dependencia
visual relevante.

Todo control interactivo necesita estado de hover cuando aplique,
`focus-visible`, teclado, contraste y área táctil suficiente. Usar
`aria-current="page"` en la navegación activa y no comunicar estados solo con
color. Las animaciones no deben cambiar el layout final, dejar contenido útil
oculto sin JavaScript ni ejecutarse contra la preferencia de movimiento
reducido.

## Perfil de exportación estática

Cuando el hosting y el proyecto estén definidos como export estático, comprobar
la configuración efectiva del framework. En Next.js suele incluir
`output: "export"`, `trailingSlash: true` y una estrategia de imágenes
compatible con exportación estática.

Materializar durante el build contenido, rutas, metadata, sitemap y JSON-LD.
Las rutas dinámicas editoriales deben enumerar todas las entradas publicadas y
fallar de forma explícita si el snapshot esperado está vacío o incompleto.

No introducir Route Handlers, API Routes, Server Actions, middleware, ISR,
`force-dynamic` ni secretos de servidor en un proyecto que debe producir solo
archivos estáticos. Esta prohibición no aplica automáticamente a un storefront
híbrido o SSR: primero clasificar su arquitectura.

Mantener un único bootstrap de configuración pública y un cliente Bacano por
worker o árbol. Reutilizar esa misma información para páginas, metadata,
sitemap, JSON-LD y provider; no consultar cada ruta por separado si existe un
snapshot oficial compartido.

## Preview y rutas editoriales

Mantener una allowlist finita de patrones editoriales. Los índices pueden ser
explícitos y los slugs de detalle pueden derivarse de las entradas publicadas;
no aceptar una ruta arbitraria solo porque coincide con una cadena. Preview
reutiliza componentes y mappers de producción, permanece fuera del sitemap y
no habilita funciones transaccionales o marketing.

## Trazabilidad editorial

Al mapear un `ContentEntry`, conservar los atributos retornados por
`getContentEntryLocatorAttributes(entry)` hasta el componente visual. Aplicar
el spread al `section`, `article`, banner o tarjeta exterior que representa la
entrada. No repetirlo en cada título o párrafo. Si una tarjeta proviene de otra
entrada referenciada, esa tarjeta lleva su propio marcador anidado.

La salida final debe cumplir `STOREFRONT_CONTENT_LOCATOR.md`. Verificar el HTML
generado; encontrar la llamada al helper en TypeScript no demuestra que el
marcador haya llegado al DOM.

## Diagnóstico antes de cambiar código

Un `ORIGIN_NOT_ALLOWED` o un `403` al resolver la configuración durante el
build suele indicar que el origen utilizado no está autorizado para el website.
Verificar dominio canónico, orígenes permitidos y ambiente antes de alterar el
cliente SDK. Una advertencia aislada sobre ausencia de caché del build no prueba
por sí sola que el storefront esté defectuoso.

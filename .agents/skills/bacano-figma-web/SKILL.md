---
name: bacano-figma-web
description: Convierte diseños de Figma en webs y tiendas construidas con @bacano/sdk, preservando el cascarón, contratos, Static First y comportamiento oficial de Bacano. Usar al implementar una web desde enlaces, frames o archivos Figma; configurar o diagnosticar Figma MCP, Figma Desktop MCP, Desktop Bridge o REST; extraer un diseño por páginas; mapearlo a Content y componentes; o comparar visualmente la implementación con Figma.
---

# Bacano Figma Web

Implementar Figma como fuente visual y Bacano como fuente funcional. No copiar
una captura como HTML aislado ni reconstruir catálogo, carrito, checkout,
autenticación, marketing o Content por fuera de `@bacano/sdk`.

## 1. Confirmar el alcance

Antes de extraer el diseño, identificar:

- Web informativa, tienda virtual o sitio híbrido. Si permite una compra
  completa, aplicar también los contratos de tienda a su superficie
  transaccional.
- Enlace al archivo, página, sección o frame de Figma.
- Rutas que se implementarán y sus frames desktop/mobile.
- Repositorio y cascarón Bacano que se reutilizarán.
- Fuente Figma disponible y política de fallback.

Si falta una decisión que cambie materialmente el resultado, hacer una sola
pregunta corta. No solicitar un token por chat ni pedir que se guarde en el
repositorio.

## 2. Resolver la conexión con Figma

Ejecutar primero:

```bash
pnpm exec bacano-figma-web doctor
```

Leer [references/connection-official.md](references/connection-official.md) si
falta instalar o autenticar el MCP oficial. Usar este orden:

1. MCP remoto oficial de Figma.
2. MCP local oficial de Figma Desktop.
3. Desktop Bridge comunitario, local y con versión revisada/fijada.
4. Snapshot mediante REST, únicamente con autorización explícita.

No cambiar silenciosamente de fuente. Si la fuente seleccionada se agota,
responde `429` o no expone una capacidad necesaria, conservar el avance y pedir
permiso antes del fallback, salvo que el usuario haya aprobado modo automático.
Leer la guía específica únicamente cuando se elija
[Desktop Bridge](references/connection-desktop-bridge.md) o
[REST](references/connection-rest-api.md).

## 3. Extraer una vez y normalizar

Leer [references/extraction-contract.md](references/extraction-contract.md).
Crear o reutilizar un snapshot normalizado en `.bacano/designs/<proyecto>/`.
No consultar cada sección por separado si una lectura de página/frame entrega
el contexto suficiente.

Evaluar y registrar como `DISPONIBLE`, `PARCIAL` o `AUSENTE`:

- Variables y estilos.
- Componentes y variantes.
- Auto Layout, constraints y geometría.
- Nombres de capas.
- Frames desktop/mobile.
- Estados e interacciones.

La ausencia de variables o componentes no bloquea por sí sola. Inferir desde
geometría y evidencia visual, pero registrar cada inferencia. Nunca incluir PAT,
cookies, secretos, correos privados ni contenido no necesario en el snapshot.

Validar el manifiesto:

```bash
pnpm exec bacano-figma-web validate-snapshot .bacano/designs/<proyecto>/manifest.json
```

## 4. Mapear a Bacano antes de programar

Leer [references/bacano-mapping.md](references/bacano-mapping.md),
[references/content-workflow.md](references/content-workflow.md),
[references/content-media.md](references/content-media.md) y
[references/implementation-quality.md](references/implementation-quality.md).
Preparar una matriz ruta → frame → componente → fuente de datos → Content →
responsive → preview → estado, y determinar si el trabajo comienza desde
Figma, desde Bacano Content o desde ambas fuentes.

- Reutilizar el starter, tokens y componentes existentes.
- Consumir Bacano y Content mediante `@bacano/sdk`.
- Mantener un solo `BacanoProvider` y un solo cliente por árbol.
- Preservar Static First: estructura estática y estado comercial vivo mediante
  los contratos específicos del SDK.
- No usar GraphQL directo, endpoints internos ni lógica comercial duplicada.
- No codificar textos editables si pertenecen a Bacano Content.
- Marcar obligatoriamente cada región visual proveniente de un `ContentEntry`
  con `getContentEntryLocatorAttributes(entry)`. El marcador identifica la
  entrada completa, nunca campos individuales. Conservar esta identidad al
  transformar Content en view models y seguir
  `STOREFRONT_CONTENT_LOCATOR.md`.
- No alterar el storefront de referencia salvo que ese sea el proyecto indicado.

Si Content todavía no existe, generar un blueprint de entrega y fixtures
temporales fieles al contenido visible de Figma. Los fixtures deben usar el
mismo view model que consumen los componentes y entrar por un único adaptador;
nunca repartir datos de prueba dentro de la UI. Si Content ya existe, mapearlo
sin sobrescribir estructuras o entradas. Si el usuario pide materializar el
blueprint, leer la sección de automatización de
[references/content-workflow.md](references/content-workflow.md) y el contrato
`CONTENT_TYPE_MANAGEMENT.md` incluido en `@bacano/sdk`. Crear o modificar tipos,
componentes, grupos, listas y entradas únicamente mediante el acceso temporal
y los scopes oficiales. Inventariar esos recursos antes de crear otros y
preparar entradas en borrador por defecto; la media permanece en el
backoffice salvo que el usuario conceda `content_media:upload`. Con ese scope,
buscar primero imágenes reutilizables y cargar bytes únicamente mediante
`listMedia()` y `uploadImage()`; publicar requiere permiso y aprobación
explícitos.

Al proponer keys nuevas, resolver primero el idioma según
`CONTENT_TYPE_MANAGEMENT.md`: instrucción explícita, convención existente y
después idioma principal del website. No traducir ni renombrar contratos ya
utilizados por el storefront.

Antes de modificar código, indicar brevemente qué rutas y componentes se
implementarán y qué decisiones de diseño son inferidas.

## 5. Implementar por cortes verificables

Trabajar por página o conjunto pequeño de secciones:

1. Estructura semántica y responsive.
2. Tokens, tipografía, espacios y media.
3. Estados interactivos y accesibilidad.
4. Integración Bacano real.
5. Comparación visual y correcciones.

No dar una página por validada únicamente porque compila. Comparar estructura,
contenido, responsive e interacciones del corte antes de continuar y registrar
lo pendiente cuando la revisión visual quede a cargo del usuario.

No añadir paquetes, fuentes, iconos o assets si el proyecto ya ofrece un
equivalente. Descargar assets mediante la fuente Figma autorizada; no incrustar
URLs temporales ni construir transformaciones de Storage manualmente. La carga
administrativa admite JPEG, PNG o WebP raster; video, documentos, SVG y
animaciones continúan bajo revisión editorial en el backoffice.

## 6. Validar diseño y contrato

Leer [references/visual-validation.md](references/visual-validation.md).
Comparar con evidencia desktop y mobile, incluyendo viewport, captura y
diferencias relevantes. Probar además typecheck, lint, tests y build del
proyecto.

Antes de aprobar producción, comprobar que la fuente editorial efectiva sea
Bacano Content. Un fixture, placeholder o fallback temporal accesible en el
build de producción es un bloqueo, aunque visualmente coincida con Figma.
Inspeccionar además el HTML final: toda región alimentada por una entrada debe
conservar su marcador V1 con la key, nombre y locale correctos. Una región
editorial sin marcador bloquea la aprobación.

Al finalizar, invocar `$bacano-web` si está disponible para la auditoría de
producción completa. Esta skill valida fidelidad y correcta integración desde
Figma; `bacano-web` valida que el sitio pueda publicarse profesionalmente.

## 7. Entregar un cierre claro

Reportar:

- Fuente Figma y fallback usados.
- Páginas/frames extraídos e implementados.
- Snapshot y versión/fecha de extracción.
- Componentes Bacano reutilizados.
- Inferencias y diferencias aprobadas.
- Validaciones ejecutadas y pendientes reales.
- Brechas del SDK, sin workarounds directos a API o GraphQL.

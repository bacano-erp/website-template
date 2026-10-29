---
name: bacano-web
description: Audita y prepara sitios construidos con @bacano/sdk antes de publicarlos o después de un despliegue. Usar cuando se solicite evaluar una web Bacano, revisar si está lista para producción, investigar errores página por página, validar SEO, rendimiento, seguridad, legal, medición, Content, autenticación o, en tiendas virtuales, catálogo, carrito, checkout, pagos y pedidos.
---

# Bacano Web

Evaluar el sitio con evidencia del repositorio, del build y, cuando exista, del
dominio desplegado. No declarar el sitio listo basándose únicamente en una
revisión visual.

## 1. Confirmar el tipo de sitio

Antes de auditar, confirmar uno de estos alcances:

- **Web informativa**: contenido, formularios y contacto, sin compra completa.
- **Tienda virtual**: catálogo vendible y flujo de carrito/checkout/pago.

Si el usuario no lo indicó expresamente, preguntar exactamente una pregunta
corta y esperar: **“¿Esta web será informativa o una tienda virtual?”**

No aplicar la lista transaccional a una web informativa. Si un sitio híbrido
permite comprar, clasificarlo como tienda virtual.

Después construir primero la matriz arquitectónica definida en
[references/architecture-runtime.md](references/architecture-runtime.md):
catálogo estático, estado dinámico de productos, configuración pública, vista
previa editorial, marketing/analítica y funciones transaccionales. Clasificar
cada capacidad como `ACTIVA`, `INACTIVA` o `BLOQUEADA` con evidencia del código,
build y configuración pública. Añadir debajo las capacidades específicas como
autenticación, formularios, GA4, Meta, Clarity, catálogo publicitario, cupones,
pagos y entregas.

Una capacidad inactiva no bloquea la salida y sus pruebas son `NO APLICA`, no
`NO VERIFICADO`. Una capacidad activa y visible debe probarse en proporción a
su riesgo.

## 2. Leer los contratos aplicables

Leer siempre [references/common.md](references/common.md) y
[references/architecture-runtime.md](references/architecture-runtime.md).
Después leer solo:

- [references/informational.md](references/informational.md) para web informativa.
- [references/storefront.md](references/storefront.md) para tienda virtual.

Si `@bacano/sdk` está disponible, leer sus contratos canónicos aplicables antes
de proponer cambios. Como mínimo revisar `STOREFRONT_LEGAL.md`,
`STOREFRONT_MARKETING.md`, `STOREFRONT_PERFORMANCE.md` y
`STOREFRONT_PREVIEW.md`; si el sitio renderiza Bacano Content, leer también y
aplicar obligatoriamente `STOREFRONT_CONTENT_LOCATOR.md`; añadir
`AUTHENTICATION.md`, `STOREFRONT_LEADS.md`, `STOREFRONT_CLARITY.md` y
otros contratos únicamente cuando esas capacidades existan. Leer
`STOREFRONT_CONSTRUCTION.md` cuando el website permita ocultarse temporalmente.
Si la tienda acepta pagos, leer obligatoriamente `STOREFRONT_PAYMENTS.md` antes
de implementar, depurar o auditar checkout, retorno, reintentos o webhooks.
Para un carrito lento o una navegación a checkout que se queda esperando,
aplicar además la sección “Cart-to-checkout responsiveness” de
`STOREFRONT_PERFORMANCE.md` y medir el flujo publicado, no solo `next dev`.
En un checkout con autoguardado, comprobar además que no cree pedidos con
contactos parciales ni solicitudes simultáneas; tras un rechazo, el reintento
debe conservar el mismo pedido incluso si la sesión de pasarela sigue
`pending`. Aplicar los casos de [references/storefront.md](references/storefront.md).
Si existe cualquier formulario visible, leer obligatoriamente
`STOREFRONT_FORMS.md`. Para formularios propios del storefront, comprobar que
Zod valida el flujo real, con pruebas de errores por campo y bloqueo del envío
inválido; su mera presencia en `package.json` no basta. Si el formulario es
administrado desde Bacano, leer además [references/forms.md](references/forms.md)
y no duplicar su definición publicada en Zod.
Cuando marketing esté activo y existan CTA o formularios, leer
[references/interactions.md](references/interactions.md): inventariar los CTA,
asignar un propietario por evento y usar los helpers oficiales del SDK. Esta
instrumentación aplica tanto a webs informativas como a tiendas; no medir
clics decorativos ni activar proveedores sin autorización.

## 3. Auditar sin alterar el sistema

Por defecto realizar una auditoría de solo lectura. No editar código, cambiar
configuración externa, publicar, crear cuentas, enviar formularios reales ni
ejecutar compras/pagos sin autorización explícita.

1. Inspeccionar stack, scripts, rutas, variables públicas esperadas y versión
   efectiva de `@bacano/sdk`.
2. Registrar la matriz de capacidades y cuáles son críticas para el
   lanzamiento actual.
3. Identificar una sola fuente para Bacano, Content, legal, marketing y auth.
4. Ejecutar typecheck, lint, pruebas y build usando los comandos del proyecto.
5. Comparar router, salida del build y sitemap; ninguna ruta pública debe
   omitirse silenciosamente.
6. Inspeccionar HTML generado, metadata, JSON-LD, media y enlaces internos.
   Si existe Content, comparar las entradas renderizadas con los marcadores V1
   presentes en ese HTML; revisar únicamente el JSX no es evidencia suficiente.
7. Si existe un dominio o una aplicación ejecutable, auditar sus rutas reales,
   la consola y un trace de red con nombres y conteos de operaciones GraphQL.
8. Probar vistas representativas desktop y mobile.
9. Retestar individualmente cada hallazgo antes de considerarlo real.

Para una comprobación HTTP inicial puede ejecutarse:

```bash
node <skill-dir>/scripts/audit-http.mjs https://ejemplo.com --max 500 --preview /vista-previa/
```

El script no reemplaza pruebas de navegador, accesibilidad, interacción ni
flujos autenticados.

Si esta skill se leyó directamente dentro de `node_modules` y aún no está
instalada en el proyecto, ejecutar `pnpm exec bacano-web install` antes de
continuar. Verificar después con `pnpm exec bacano-web check`.

## 4. Evitar falsos positivos

- Limitar una auditoría masiva a dos navegadores concurrentes y espaciar las
  rutas. Un `429` provocado por el auditor no es un defecto del storefront.
- Repetir después de la ventana de rate limit cualquier `429`, recurso
  cross-origin o fallo transitorio.
- No reportar `net::ERR_ABORTED` aislado como error si corresponde a beacons
  cancelados al cerrar o navegar la página.
- Distinguir “no verificado” de “falló”. Login, pago, correo y webhooks no se
  consideran aprobados si no se ejecutó el flujo real.
- No recomendar comodines amplios en CSP para silenciar la consola.

## 5. Entregar un cierre verificable

Usar [references/report.md](references/report.md). Cada control debe quedar como
`✅ APROBADO`, `⚠️ ADVERTENCIA`, `❌ FALLÓ`, `➖ NO APLICA` o
`🧪 NO VERIFICADO`, con evidencia concreta. Mantener siempre la palabra del
estado junto al emoji para que el informe siga siendo buscable y procesable.

Clasificar controles por su efecto en la salida:

1. `P0 · Gate`: bloquea publicación si falla; si no se pudo verificar, el
   dictamen queda incompleto.
2. `P1 · Calidad`: requisito profesional que permite salir solo con riesgo
   explícito y responsable.
3. `P2 · Mejora`: evolución deseable que nunca cambia por sí sola el dictamen.

No decir “listo para producción” mientras exista un `❌ FALLÓ` P0 o una
capacidad esencial activa permanezca `🧪 NO VERIFICADO`.

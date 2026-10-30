# Formularios públicos de Bacano

Aplicar este contrato cuando el sitio muestre al menos un formulario administrado
desde Bacano. Leer también `STOREFRONT_FORMS.md` completo desde el paquete SDK.

## Creación asistida y sincronización

Si falta el formulario, proponer su definición y pedir el acceso temporal de
**Conectar agente** en Formularios o Content. Leer `CONTENT_TYPE_MANAGEMENT.md`.
Usar `createContentManagementClient` con `forms:manage`; inventariar sitios,
listas y formularios antes de crear. Editar mediante `updateForm()` enviando
el documento completo y `expectedUpdatedAt`. Los conflictos exigen releer,
no sobreescribir. Publicar o retirar requiere `forms:publish` y confirmación.
No duplicar las definiciones en Content, GraphQL, SQL ni en fixtures permanentes.
El storefront consume la key y versión publicada usando el SDK público.
El acceso administrativo no permite leer respuestas ni PII. `CAPTURE_LEAD`
ya resuelve la identidad; no ejecutar una segunda captura por campaña.

## Implementación oficial

- Clasificar formularios como `ACTIVA`, `INACTIVA` o `BLOQUEADA` en la matriz de
  capacidades.
- Usar `BacanoForm` desde `@bacano/sdk/react/forms` o un renderer propio basado
  exclusivamente en `useBacanoForm()`.
- Reutilizar el único `BacanoProvider` y cliente global del sitio. No crear otro
  cliente, consultar GraphQL ni llamar endpoints internos.
- No duplicar keys, validaciones, opciones o estructura en un esquema local.
  En particular, no imponer un esquema Zod paralelo a la definición publicada;
  Zod corresponde a formularios propios del storefront (ver `STOREFRONT_FORMS.md`).
- En Static First, obtener la definición durante build/servidor y entregarla
  como `initialForm`. La revalidación runtime no debe borrar el HTML inicial.
- Renderizar campos directos, secciones visuales y pasos según su semántica. Una
  sección no es un paso y no debe inventar navegación.
- Las listas de Content llegan resueltas por Bacano; el storefront no reconstruye
  opciones ni consulta Content por separado.

## Envío y seguridad

- Enviar mediante `client.forms.submitResponse()` o el envío interno de
  `BacanoForm`.
- `honeypot` es un campo trampa, no un nonce, timestamp, UUID ni dato del
  visitante. `BacanoForm` lo administra. En un renderer manual, omitirlo salvo
  que exista un input trampa realmente oculto; para una persona siempre debe
  permanecer vacío y el autocompletado no debe llenarlo.
- `accepted: true` con `responseId: null` es una aceptación silenciosa antispam:
  no demuestra que la respuesta fue guardada. La verificación funcional exige
  un UUID y la respuesta visible una sola vez en Bacano.
- Los datos de contacto deben conservar su semántica: usar campos `email` y
  `phone`. Un campo `text` llamado correo o teléfono se guarda como texto libre
  y no alimenta los datos de contacto normalizados para CRM o automatizaciones.
- Conservar una `idempotencyKey` durante reintentos del mismo intento lógico.
- Enviar la versión y `definitionHash` exactos de la definición renderizada.
- Respetar estados `ACTIVE` y `PAUSED`; no renderizar borradores o archivados.
- No escribir respuestas o PII en consola, analítica, URLs o logs del storefront.
- En `CAPTURE_LEAD`, Bacano conserva primero la respuesta y resuelve la identidad
  internamente. No afirmar al visitante que se creó un lead o que ya era cliente:
  la respuesta pública es genérica y no expone ese resultado.
- No afirmar que se envió un correo, se entregó un cupón o se abrió una solicitud
  si esa acción aún no está implementada y verificada en Bacano.
- Una brecha del SDK se reporta; nunca se resuelve con GraphQL directo ni una API
  paralela del storefront.

## Verificaciones obligatorias

Con marketing activo, aplicar también [interactions.md](interactions.md).
`BacanoForm` ya instrumenta su ciclo: no añadir listeners paralelos. Renderers
personalizados usan `useBacanoFormTracking`; modal/drawer debe comunicar su
visibilidad real. Verificar la distinción entre intento, persistencia y lead.

- Formulario activo: estructura, labels, required, ayudas, opciones y envío.
- Formulario pausado e inexistente: mensaje seguro y ningún envío.
- Versión desactualizada: refresh oficial y conservación controlada de datos.
- Doble clic y reintento: una sola respuesta por intento idempotente.
- Error de red: estado recuperable sin promesa falsa de recepción.
- Persistencia: la respuesta aparece una sola vez en Bacano con versión, origen y
  snapshot correctos.
- Autocompletado: completar datos con el navegador o un gestor de contraseñas no
  llena el honeypot ni produce `responseId: null`.
- Semántica: correo y teléfono usan `email` y `phone`; no se infieren por label o
  key.
- Accesibilidad: label asociado, foco, teclado, mensajes de error y progreso de
  pasos comprensibles.
- Static First: el HTML exportado conserva el formulario cuando corresponde.

Reportar evidencia con la key pública, ruta, archivo del renderer, requests
observados y prueba de persistencia. Nunca incluir valores personales reales en
el informe.

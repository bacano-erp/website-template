# Flujo de contenido entre Figma, desarrollo y Bacano

Diseño, programación y gestión editorial pueden comenzar en cualquier orden.
La coordinación se hace mediante un blueprint de contenido; Figma no se
convierte en base de datos y los componentes no dependen de datos temporales.

## 1. Clasificar la propiedad de cada dato

Antes de crear campos o fixtures, asignar cada valor a una fuente:

| Información | Fuente habitual |
| --- | --- |
| Títulos, textos, banners y bloques editoriales | Bacano Content |
| Campos, opciones, pasos y validaciones de formularios | Formularios de Bacano; nunca tipos de Content |
| Productos, variantes, precios y disponibilidad | Catálogo y live state del SDK |
| Legal, branding y configuración del sitio | `publicConfig` |
| Carrito, checkout, cliente y pedidos | Módulo correspondiente del SDK |
| Etiquetas permanentes de interfaz | Código e i18n del storefront |

No duplicar en Content información que ya tiene una fuente funcional. Un valor
visible en Figma no implica que sea editorial.

Para materializar un formulario del diseño, seguir `STOREFRONT_FORMS.md` y la
sección de formularios de `CONTENT_TYPE_MANAGEMENT.md`. El cliente temporal
admite `forms:manage` para crear/editar borradores y `forms:publish` para publicar
con confirmación. Reutilizar la definición del ERP y sus pares value/label;
no inventar un esquema paralelo. Los conflictos de revisión requieren releer.

## Modelar sin extremos

No convertir una página extensa en un único tipo gigante ni crear un componente
para cada bloque visual. Separar una sección cuando tenga ciclo editorial,
responsable, reutilización o repetición propios. Crear un componente compartido
solo cuando coincidan tanto la estructura como el significado y la abstracción
reduzca duplicación real.

- Usar grupos para organizar entradas relacionadas por dominio o página.
- Usar repetibles para pasos, integrantes, preguntas, tarjetas y otras
  colecciones homogéneas.
- Mantener directamente en el tipo los campos de un bloque exclusivo y simple.
- Crear primero listas y componentes realmente compartidos; después los tipos
  consumidores.
- No hacer depender la UI del shape crudo de Content: fixture y mapper real
  deben converger en el mismo view model.
- Conservar en ese view model los atributos producidos por
  `getContentEntryLocatorAttributes(entry)`. Toda región visual administrada
  por una entrada debe exponerlos en su contenedor DOM exterior; no se marcan
  campos individuales.

## 2. Elegir el punto de partida

### Figma primero

1. Extraer el contenido público visible y sus assets autorizados.
2. Resolver el idioma y proponer tipos, keys, campos y entradas en
   `content-blueprint.json` siguiendo `CONTENT_TYPE_MANAGEMENT.md`.
3. Crear fixtures locales que implementen el view model de la página.
4. Implementar y validar el diseño contra esos fixtures.
5. Entregar el blueprint al equipo de Content para crearlo en Bacano.
6. Conectar las keys reales sin modificar los componentes visuales.

### Bacano Content primero

1. Inventariar tipos, campos, keys y entradas existentes mediante contratos
   públicos documentados.
2. Mapear los frames de Figma al contenido real.
3. Señalar incompatibilidades de estructura antes de programar.
4. Reutilizar las keys existentes; no crear aliases o estructuras paralelas
   únicamente para hacer coincidir un frame.

### Fuentes en paralelo

Comparar el blueprint propuesto con Bacano. Clasificar cada sección como
`ready`, `missing`, `needs-mapping` o `blocked` y asignar responsable. No
sobrescribir datos reales ni asumir que el diseño más reciente autoriza una
migración editorial.

## 3. Blueprint de entrega

Guardar el archivo junto al snapshot:

```text
.bacano/designs/<proyecto>/content-blueprint.json
```

Estructura recomendada:

```json
{
  "schemaVersion": 1,
  "project": "mi-storefront",
  "source": "figma",
  "routes": [
    {
      "route": "/",
      "sections": [
        {
          "sectionKey": "hero-inicio",
          "figmaNodeId": "1:20",
          "component": "HomeHero",
          "ownership": "content",
          "contentTypeKey": "hero_inicio",
          "entryKey": "hero-principal-inicio",
          "status": "missing",
          "fields": [
            {
              "key": "titulo",
              "type": "text",
              "required": true,
              "sampleValue": "Compra para cada etapa"
            }
          ],
          "fixture": "fixtures/hero-inicio.json"
        }
      ]
    }
  ]
}
```

El blueprint es una propuesta y una evidencia de coordinación, no una orden de
escritura. No incluir IDs internos innecesarios, secretos, datos personales ni
respuestas crudas de GraphQL. Mantener keys estables y registrar cambios que
rompan el contrato. Las propiedades técnicas del formato del blueprint
permanecen en inglés; los valores que representan tipos, componentes, campos y
entradas definidos por la empresa siguen el idioma resuelto para el proyecto.

## 4. Fixtures temporales

- Usar contenido real del diseño cuando esté disponible; evitar Lorem ipsum.
- Guardarlos en un único directorio y cargarlos mediante un adaptador explícito.
- Hacer que implementen el view model que consumen los componentes, no una
  copia inventada de respuestas GraphQL ni de internals del SDK.
- Mantener el mapper de Bacano separado: `Content` real y fixture deben terminar
  en el mismo view model.
- Incluir estados vacío, incompleto y contenido largo en pruebas separadas; no
  convertirlos en el contenido principal de la página.
- No crear fixtures para precios, stock, autenticación, carrito, checkout,
  pedidos o atribución.

Una forma válida de separación es:

```text
fixture ───────┐
               ├─> PageContentViewModel ─> componentes
Bacano mapper ─┘
```

El cambio de fuente debe ocurrir en el loader o repositorio de contenido, nunca
mediante condicionales repartidos por los componentes.

Los fixtures pueden simular el view model, pero no deben inventar marcadores de
entrada en producción. El marcador definitivo se deriva del `ContentEntry`
real para que nombre, key y locale no diverjan.

## 5. Entrega al equipo de Content

Entregar una tabla legible con:

- Ruta y sección visible.
- Tipo y entry key sugeridos.
- Campos, tipo, obligatoriedad y ejemplo tomado de Figma.
- Assets desktop/mobile, proporción y uso esperado.
- Estado y responsable.
- Dependencias entre componentes, listas y entradas.

El equipo de Content puede crear o ajustar la estructura desde Bacano. Si el
usuario autoriza que el agente materialice el blueprint, usar exclusivamente
`@bacano/sdk/content-management` y el token temporal generado desde **Conectar
agente**. Confirmar la empresa y los scopes, inventariar primero, crear
componentes antes de sus consumidores y trabajar inicialmente en borrador. La
skill puede preparar entradas cuando el usuario conceda
`content_entries:manage`. Si además se concede `content_media:upload`, debe
buscar y cargar imágenes por el contrato descrito en
[content-media.md](content-media.md). No publica sin el scope específico.

## 6. Cambio a Bacano real

Antes de retirar el fixture:

1. Confirmar que las keys reales coinciden con el blueprint.
2. Validar campos requeridos, media y contenido largo.
3. Comparar la página con Figma usando Content real.
4. Verificar preview si la capacidad está activa.
5. Inspeccionar el HTML y confirmar los marcadores definidos en
   `STOREFRONT_CONTENT_LOCATOR.md` para cada región editorial.
6. Eliminar el fixture del camino de ejecución, no necesariamente de los tests.

En producción no se permite fallback silencioso a fixtures. Si una página
depende de contenido temporal, reportar `❌ NO LISTO` con las rutas y secciones
afectadas. Los fixtures pueden conservarse como datos de pruebas unitarias o
visuales siempre que no entren en el bundle o loader de producción.

## 7. Automatización administrativa

La gestión de tipos pertenece al entrypoint separado
`@bacano/sdk/content-management`, no al cliente público del storefront. Antes de
escribir:

1. Pedir al usuario que genere un acceso temporal de 15, 30 o 60 minutos.
2. Guardarlo solo en el entorno local del proceso del agente.
3. Ejecutar `getContext()`, comprobar sus `scopes`, y después `listTypes()`,
   `listGroups()`, `listOptionLists()` y `getReferences()`.
4. Mostrar el plan y esperar aprobación cuando altere estructuras existentes.
5. Crear primero listas y componentes, luego tipos consumidores, y mantener las
   estructuras nuevas en borrador hasta validarlas.
6. Si se concedió `content_entries:manage`, inventariar entradas por tipo, key y
   locale; crear las faltantes en borrador y actualizar únicamente con
   `expectedUpdatedAt`.
7. No fusionar por nombres, no usar HTML crudo y no relacionar URLs remotas. La
   media debe existir en Bacano y pertenecer a la empresa autorizada; resolver
   su `fileId` mediante `listMedia()` o `uploadImage()`.
8. Para archivar o eliminar tipos, entradas, grupos o listas, inspeccionar
   dependencias y confirmar nuevamente. Una actualización de lista debe enviar
   todos los elementos que deben permanecer, incluidos sus IDs existentes.
9. Publicar o modificar una entrada publicada solo con
   `content_entries:publish` y una aprobación humana explícita.

Nunca exponer el token en el navegador, commit, blueprint, salida de consola o
chat. Nunca convertir el blueprint en una importación implícita ni usar GraphQL
directo. Sin `content_media:upload`, toda media permanece bajo gestión
editorial en el backoffice.

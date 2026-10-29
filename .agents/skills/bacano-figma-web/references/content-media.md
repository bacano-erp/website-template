# Imágenes de Content desde un agente

Usar este flujo solo cuando `getContext().scopes` incluya
`content_media:upload`. El token temporal continúa siendo administrativo: no se
incluye en el storefront, Figma, archivos del proyecto, logs ni respuestas al
usuario.

## Orden obligatorio

1. Clasificar el asset: hero desktop/mobile, card, galería, logo, decorativo u
   otro uso editorial.
2. Buscar en `listMedia()` con términos semánticos. Reutilizar únicamente cuando
   sea el mismo asset, no solo una imagen parecida.
3. Exportar desde la fuente Figma autorizada los bytes originales necesarios.
4. Para imágenes informativas, preparar un nombre descriptivo y `altText`
   contextual. No usar nombres de capas como `Frame 32` o `image_1`.
5. Cargar con `uploadImage()`. Nunca usar GraphQL, URLs de Figma, base64 dentro
   de una entrada ni endpoints directos de Nhost Storage.
6. Guardar en Content el `fileId` devuelto y volver a consultar la entrada.
7. Mantener en borrador hasta validar imagen, encuadre, responsive y texto
   alternativo en contexto.

```ts
import { readFile } from "node:fs/promises";
import { createContentManagementClient } from "@bacano/sdk/content-management";

const content = createContentManagementClient({
  apiUrl: process.env.BACANO_API_URL!,
  accessToken: process.env.BACANO_CONTENT_ACCESS_TOKEN!,
});

const matches = await content.listMedia({ search: "hero juguetes" });
const media = matches.items[0] ?? await content.uploadImage({
  file: await readFile("./exports/hero-juguetes-desktop.png"),
  fileName: "Hero juguetes para bebé desktop",
  altText: "Niña jugando con bloques de colores",
});

console.log(media.fileId);
```

## Contrato de la primera versión

- Admite JPEG, PNG y WebP raster no animado.
- Máximo 10 MB de entrada y 100 megapíxeles.
- Bacano valida bytes reales, corrige orientación y normaliza a WebP.
- El nombre se convierte a un filename SEO seguro.
- Los duplicados binarios normalizados se reutilizan dentro de la misma
  empresa; nunca entre empresas.
- SVG, GIF animado, video y documentos se cargan desde el backoffice.
- El agente no reemplaza ni elimina físicamente media.
- `altText` de biblioteca es fallback. El texto alternativo final pertenece al
  uso dentro de la entrada; una imagen decorativa usa `alt=""` en ese contexto.

Si el asset no cabe en este contrato, reportar `BLOQUEADO` y pedir que el equipo
editorial lo prepare en la biblioteca. No convertirlo de forma improvisada ni
introducir paquetes o servicios paralelos.

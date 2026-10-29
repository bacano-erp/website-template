# Crear un sitio nuevo

## 1. En Bacano

Antes de tocar código, el website tiene que existir en la plataforma:

- **Sitio web creado** con su *slug*. El slug es de una sola etiqueta, sin
  puntos: termina siendo `<slug>.sites.bacanoerp.com`, y el certificado comodín
  cubre un solo nivel.
- **Sucursal** asociada, con productos activos y precios públicos si es tienda.
- **Listas** en *Sitios web → Listas de categorías / de atributos*. Sus claves
  van en `src/config/bacano-lists.ts`: deciden qué categorías se navegan y qué
  atributos se vuelven filtros.
- **Orígenes permitidos**: el dominio del sitio. El gateway rechaza cualquier
  otro, también desde el navegador.

Sin un slug válido el build falla a propósito: es mejor que publicar una tienda
vacía con el deploy en verde.

## 2. Variables

Todo lo que hay aquí llega al navegador: solo existen variables
`NEXT_PUBLIC_*`.

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_BACANO_API_URL` | El gateway de Bacano |
| `NEXT_PUBLIC_BACANO_WEBSITE_SLUG` | El slug del website |
| `NEXT_PUBLIC_SITE_URL` | La URL pública del sitio. Obligatoria: sin ella las URLs canónicas apuntarían a localhost |
| `NEXT_PUBLIC_SITE_NAME` | El nombre que se muestra |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Opcional. Solo si el cliente tiene cuentas de comprador |

En local se copian de `.env.example` a `.env.local`. En CI y en el deploy las
inyecta Bacano como variables del repositorio al aprovisionar el sitio.

**Cuentas de comprador (Clerk)** son opcionales y se deciden por cliente. Con
la variable vacía la tienda funciona sin cuentas: navegación, carrito y
checkout como invitado. Una clave *secreta* de Clerk nunca va en este repo.

## 3. Primer arranque

```bash
pnpm install
cp .env.example .env.local    # completar con los valores reales
pnpm dev
```

Para ver el sitio como lo sirve producción (barra final, rutas estáticas):

```bash
pnpm build && pnpm start
```

## 4. Antes de dar algo por terminado

```bash
pnpm verify       # tipos, Biome, ESLint, guard de publicación y skills
pnpm verify:all   # lo anterior más las pruebas sobre el export, lo que corre CI
```

## 5. Identidad visual

Primero que la tienda funcione, después el diseño. Ese orden es mucho más rápido
que pelear con el diseño de otro. Las skills `bacano-web` (auditoría antes de
producción) y `bacano-figma-web` (implementar desde Figma) ya están instaladas
en `.agents/skills/`.

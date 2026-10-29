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
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opcional, solo en local. Con número, el checkout y el pedido ofrecen ayuda por WhatsApp. El deploy de Bacano no la inyecta: en producción el número va en `src/config/store.ts` |

En local se copian de `.env.example` a `.env.local`. En CI y en el deploy las
inyecta Bacano como variables del repositorio al aprovisionar el sitio.

**Cuentas de comprador (Clerk)** son opcionales y se deciden por cliente **en
Bacano**, no aquí: al activarlas en el website, Bacano entrega la clave
*publicable* de Clerk en la configuración pública y la tienda la usa sin
rebuild. Sin cuentas, la tienda funciona como invitado: navegación, carrito y
checkout. Clerk solo se carga en las rutas que lo necesitan (checkout, pedido,
cuenta). Una clave *secreta* de Clerk nunca va en este repo.

## 3. ¿Tienda o sitio informativo?

La plantilla trae la tienda completa: carrito, checkout, pago y pedido. Antes de
cualquier otra cosa se decide qué es este sitio, y **lo decide la persona**, no
el agente:

```bash
pnpm setup:site --tipo=tienda   # vende: se conserva todo
pnpm setup:site --tipo=sitio    # no vende: se quita la tienda
pnpm setup:site --tipo=sitio --dry-run   # muestra qué se quitaría
```

Con `--tipo=sitio` se borran las rutas, módulos, estilos, pruebas y
dependencias de la tienda, y se limpian los bloques marcados `<commerce>` en los
archivos compartidos. Queda la base: vista previa, localizador, construcción,
catálogo y SEO. Es un paso de una sola vía: el script se borra a sí mismo al
terminar. Si se corre sin `--tipo` en una terminal, pregunta; sin terminal (un
agente), se detiene y pide preguntarle a la persona.

Las cuentas de comprador no se deciden aquí: se activan en Bacano cuando el
cliente las necesite (ver la sección 2).

## 4. Primer arranque

```bash
pnpm install
cp .env.example .env.local    # completar con los valores reales
pnpm dev
```

Para ver el sitio como lo sirve producción (barra final, rutas estáticas):

```bash
pnpm build && pnpm start
```

## 5. Antes de dar algo por terminado

```bash
pnpm verify       # tipos, Biome, ESLint, guard de publicación y skills
pnpm verify:all   # lo anterior más las pruebas sobre el export, lo que corre CI
```

## 6. Identidad visual

Primero que la tienda funcione, después el diseño. Ese orden es mucho más rápido
que pelear con el diseño de otro. Las skills `bacano-web` (auditoría antes de
producción) y `bacano-figma-web` (implementar desde Figma) ya están instaladas
en `.agents/skills/`.

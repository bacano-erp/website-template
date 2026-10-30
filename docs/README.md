# Documentación de la plantilla

Guías en español para quien crea o mantiene un sitio a partir de esta plantilla,
sea una persona o un agente. El `AGENTS.md` de la raíz tiene las reglas duras;
estas guías explican el porqué y el cómo.

| Guía | Para qué |
|---|---|
| [inicio.md](./inicio.md) | Crear un sitio nuevo: el website en Bacano, las variables y el primer build |
| [sdk.md](./sdk.md) | Cómo se inicia `@bacano/sdk` aquí, cómo evitar el límite de solicitudes y cómo actualizarlo |
| [comercio.md](./comercio.md) | Carrito, checkout, pagos y pedido: cómo funcionan y qué se configura en Bacano |
| [piezas-de-fabrica.md](./piezas-de-fabrica.md) | Vista previa, localizador de Content y sitio en construcción: qué hacen y qué no hay que romper |
| [publicar.md](./publicar.md) | Qué pasa al hacer push o al presionar **Publicar** en Bacano |
| [decisiones.md](./decisiones.md) | Decisiones que ya tomaron otros sitios en producción y que esta plantilla adopta |

Las guías del propio SDK (pagos, formularios, marketing, legales, vista previa)
vienen dentro del paquete: `node_modules/@bacano/sdk/*.md`, y las skills de
agente en `.agents/skills/`.

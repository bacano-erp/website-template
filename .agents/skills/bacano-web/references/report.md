# Formato del informe

## Contexto

- Tipo: web informativa o tienda virtual.
- Repositorio, rama y commit.
- Ambiente y dominio.
- Framework, hosting y versión efectiva de `@bacano/sdk`.
- Fecha de revisión.

## Alcance detectado

Antes del dictamen incluir una tabla corta:

| Capacidad | Estado | ¿Bloquea este lanzamiento? | Evidencia |
| --- | --- | --- | --- |
| Catálogo estático, estado vivo, public-config, preview, marketing, transacciones | ACTIVA/INACTIVA/BLOQUEADA | Sí/No | configuración, código o prueba |

No exigir pruebas a una capacidad `INACTIVA`. Una capacidad `BLOQUEADA` debe
explicar la dependencia ausente y su impacto.

## Resultado ejecutivo

Indicar una sola conclusión:

- `🟢 LISTO`: sin fallos P0 y con flujos esenciales verificados.
- `🟡 LISTO CON ADVERTENCIAS`: sin bloqueos P0, con riesgos P1 aceptables.
- `🔴 NO LISTO`: existe al menos un `❌ FALLÓ` P0 confirmado.
- `🟠 INCOMPLETO`: falta verificar al menos un P0 activo y no hay evidencia
  suficiente para declararlo fallido.

No usar `NO LISTO` únicamente porque una función apagada no se probó. Si
coexisten un fallo P0 y pruebas pendientes, prevalece `🔴 NO LISTO`.

## Evidencia

| Prioridad | Estado                                                                    | Área | Control | Evidencia                | Acción |
| --------- | ------------------------------------------------------------------------- | ---- | ------- | ------------------------ | ------ |
| P0/P1/P2  | ✅ APROBADO / ⚠️ ADVERTENCIA / ❌ FALLÓ / ➖ NO APLICA / 🧪 NO VERIFICADO | ...  | ...     | comando, URL o resultado | ...    |

Usar siempre emoji y palabra. Los emojis solos no son suficientemente claros
ni procesables.

## Pruebas ejecutadas

Listar comandos y sus resultados, rutas auditadas, navegadores/viewports y
flujos externos realmente ejecutados. Separar pruebas locales de producción.

## Arquitectura SDK y tráfico runtime

Incluir siempre esta sección:

| Control | Resultado | Evidencia |
| --- | --- | --- |
| Instancias de `BacanoClient` y `BacanoProvider` | cantidad | archivos o prueba |
| Operaciones GraphQL en carga inicial | cantidad y nombres | trace/HAR |
| Operaciones duplicadas | cantidad, nombres y causa | variables y fase |
| Datos estáticos | inventario | HTML, snapshot o build |
| Datos actualizados en runtime | inventario | requests observados |
| Static First | cumple/no cumple/no verificado | conclusión |
| Preview | cumple/no cumple/no aplica/no verificado | conclusión |

Para cada incumplimiento indicar severidad, efecto y recomendación. No afirmar
que no hubo requests cuando no se capturó un trace real.

## Riesgos y próximos pasos

Cuando haya marketing activo, incluir inventario `CTA/formKey → ubicación →
evento → propietario → evidencia`. Separar pruebas automatizadas, transporte
observado y recepción confirmada en los paneles. Enumerar interacciones sin
instrumentar; un script cargado no demuestra que el evento llegó al proveedor.

Ordenar por severidad. Cada hallazgo debe incluir alcance, causa confirmada o
hipótesis explícita, corrección propuesta y prueba de cierre. No mezclar
mejoras opcionales con bloqueos de salida.

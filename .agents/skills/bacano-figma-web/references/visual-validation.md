# Validación visual y funcional

Validar por cortes para evitar corregir 70 secciones al final.

Para cada corte, distinguir `implementado`, `validado`, `pendiente de revisión
humana`, `no aplica` y `bloqueado`. Si el usuario conserva la validación visual,
no convertir su ausencia en una aprobación automática.

## Evidencia mínima por página

- URL/ruta implementada.
- Frame y node ID de referencia.
- Viewport desktop y mobile utilizados.
- Captura de referencia y captura de implementación.
- Diferencias intencionales e inferencias.
- Resultado de accesibilidad/interacción aplicable.

## Orden de revisión

1. Estructura, jerarquía y contenido.
2. Breakpoints, anchuras y flujo responsive.
3. Tipografía, color, espacios y radios.
4. Imágenes, recortes, densidad y estado de carga.
5. Hover, focus, teclado, formularios y navegación.
6. Estados loading, vacío, error y contenido largo.
7. Integración Bacano y ausencia de datos inventados.
8. Contenido editorial real o fixture temporal claramente identificado.

Usar Playwright o la herramienta de navegador disponible para capturas y
traces. Una comparación pixel a pixel puede ayudar, pero no debe ocultar fallos
semánticos o funcionales.

## Cierre técnico

- Typecheck, lint, tests y build del proyecto.
- Rutas generadas y sitemap esperado.
- Sin errores de consola/recurso.
- Sin GraphQL directo ni solicitudes duplicadas evitables.
- HTML estático presente cuando el contrato es Static First.
- Media responsive sin upscale visible.
- Ningún fixture, placeholder o fallback editorial temporal en el build de
  producción.
- `$bacano-web` ejecutado al final cuando corresponda.

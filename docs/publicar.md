# Publicar

Hay una sola forma de desplegar, y la maneja
`.github/workflows/deploy.yml`. No se edita: Bacano lo administra y le inyecta
su configuración como variables del repositorio.

| Qué cambió | Qué lo dispara |
|---|---|
| Código | Un push a `main` |
| Contenido, catálogo o precios | **Publicar** en Bacano, que envía el evento `bacano-publish` al repositorio |

Los dos caminos corren lo mismo: build estático → subida a S3 → invalidación de
CloudFront. Los despliegues se encolan y nunca se cancelan: cancelar uno a la
mitad deja páginas apuntando a archivos que ya se borraron.

No hay credenciales de AWS en el repositorio. El job asume, por OIDC, un rol
que solo puede escribir en el bucket de este sitio e invalidar su distribución.

## Antes de hacer push

- `pnpm verify:all` en verde: es lo mismo que corre CI.
- Este repositorio es **público**, y también lo son los mensajes de commit y el
  título y la descripción de cada PR. Ningún nombre de cliente, dominio de
  cliente, repositorio privado ni dirección interna. `pnpm check:disclosure` lo
  revisa; que una frase identifique a un cliente lo tiene que cuidar quien la
  escribe.

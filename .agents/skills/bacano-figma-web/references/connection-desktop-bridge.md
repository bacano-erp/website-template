# Desktop Bridge comunitario

“Figma Desktop Bridge” no es el MCP local oficial de Figma. Esta guía se refiere
al bridge incluido por el proyecto comunitario `southleft/figma-console-mcp`,
que conecta un plugin de Figma Desktop con su servidor MCP.

Usarlo solo cuando el MCP oficial no exponga datos locales necesarios, por
ejemplo determinadas variables o descripciones accesibles mediante Plugin API.

## Reglas de seguridad

- Preferir modo local.
- Revisar el repositorio y fijar una versión o commit aprobado; no depender de
  `@latest` en automatizaciones reproducibles.
- Mantener Figma Desktop abierto y el plugin activo durante la extracción.
- No exponer ni redirigir a Internet los puertos locales `9223`–`9232`.
- Guardar el PAT en el almacén de secretos o entorno del cliente MCP, nunca en
  `.mcp.json`, el repositorio, el snapshot o los logs.
- No habilitar cloud relay o escritura sin autorización explícita.

## Instalación orientativa

El proyecto upstream publica instrucciones actualizadas en:

- https://github.com/southleft/figma-console-mcp
- https://github.com/southleft/figma-console-mcp/blob/main/figma-desktop-bridge/README.md

Seguir la versión revisada de esas instrucciones para:

1. Instalar/configurar el servidor MCP comunitario.
2. Importar el manifest del plugin generado por el servidor.
3. Abrir el plugin dentro del archivo Figma.
4. Confirmar la conexión local del bridge.
5. Ejecutar una lectura mínima antes de extraer todas las páginas.

El comando `pnpm exec bacano-figma-web doctor` solo detecta puertos locales
compatibles. No demuestra que el plugin esté conectado, que el archivo sea el
correcto ni que el servidor sea confiable; esas tres condiciones deben
verificarse dentro del agente.

## Salida esperada

Normalizar la respuesta del bridge al mismo manifiesto definido en
`extraction-contract.md`. No permitir que detalles propios del bridge se filtren
a los componentes React ni a los contratos públicos de Bacano.

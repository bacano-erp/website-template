# Conexión oficial con Figma

Elegir preferiblemente el MCP remoto oficial. Requiere autorización de la
cuenta Figma, pero no mantener Figma Desktop abierto.

## MCP remoto oficial

Endpoint oficial:

```text
https://mcp.figma.com/mcp
```

### Codex CLI

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
```

Completar OAuth cuando Codex lo solicite. En la aplicación Codex también puede
instalarse/conectarse el plugin oficial de Figma desde Plugins.

### Claude Code

Figma recomienda primero su plugin oficial:

```bash
claude plugin install figma@claude-plugins-official
```

Configuración manual equivalente:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Usar `--scope user` únicamente si la conexión debe estar disponible en todos
los proyectos de ese usuario.

### VS Code y clientes MCP compatibles

```json
{
  "inputs": [],
  "servers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

No copiar tokens dentro del archivo. El cliente debe realizar OAuth.

### Cursor

Figma recomienda instalar su plugin oficial desde el chat del agente:

```text
/add-plugin figma
```

En otros agentes, comprobar primero que aparezcan en el catálogo de clientes
admitidos por Figma. No asumir que cualquier cliente MCP puede completar el
OAuth del servidor remoto.

## MCP local oficial de Figma Desktop

Usarlo cuando se necesite trabajar con la selección actual del archivo o el MCP
remoto no sea apropiado para la organización.

1. Actualizar y abrir Figma Desktop.
2. Abrir un archivo Design.
3. Activar Dev Mode con `Shift+D`.
4. En el panel Inspect, habilitar Desktop MCP.
5. Mantener Figma Desktop y el archivo abiertos.

Endpoint local:

```text
http://127.0.0.1:3845/mcp
```

Claude Code:

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

Configuración genérica:

```json
{
  "servers": {
    "figma-desktop": {
      "url": "http://127.0.0.1:3845/mcp",
      "type": "http"
    }
  }
}
```

## Verificación dentro del agente

La CLI de Bacano no puede inspeccionar el registro MCP ni el OAuth privado de
todos los agentes. Dentro de la conversación, comprobar:

1. Que exista una herramienta Figma disponible.
2. Ejecutar `whoami` cuando el servidor la exponga.
3. Leer un frame pequeño mediante su enlace exacto.
4. Confirmar que el agente recibe contexto de diseño, no solo una captura.

El servidor remoto trabaja mediante un enlace exacto al frame/capa. La
selección actual sin enlace está disponible únicamente con el servidor Desktop.

Según Figma, los límites dependen del plan y asiento. Actualmente un asiento Dev
o Full en Professional admite hasta 200 lecturas diarias y 10 por minuto; Figma
puede modificar esos límites. Ante `429`, conservar el snapshot y reanudar
después, sin repetir nodos ya extraídos.

Fuentes oficiales:

- https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- https://developers.figma.com/docs/figma-mcp-server/local-server-installation/
- https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/
- https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/

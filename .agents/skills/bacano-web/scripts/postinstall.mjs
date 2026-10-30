if (!process.env.CI && process.env.BACANO_SDK_HIDE_SKILL_NOTICE !== "1") {
  console.log(`
@bacano/sdk incluye la skill Bacano Web para evaluar sitios antes de producción.
Instálala una vez:       pnpm exec bacano-web install --agent all
Verifica su estado:      pnpm exec bacano-web check
Luego invócala desde tu agente para iniciar la auditoría.

Para implementar un diseño Figma con el cascarón Bacano:
Instala la skill:        pnpm exec bacano-figma-web install --agent all
Revisa la conexión:      pnpm exec bacano-figma-web doctor
`);
}

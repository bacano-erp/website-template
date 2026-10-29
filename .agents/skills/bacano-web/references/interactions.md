# Instrumentación de CTA y formularios

Requiere SDK **1.2.0 o posterior**, una vez publicado. Leer los eventos y reglas
de `STOREFRONT_MARKETING.md`. No instalar snippets ni crear providers por página.

## Migración

1. Actualizar el SDK cuando Bacano confirme su publicación. Reinstalar la skill
   con `pnpm exec bacano-web install` y verificar con `bacano-web check`.
2. Conservar el único `BacanoProvider` y `BacanoMarketingProvider` existentes.
   Su `publicConfig` viene de Bacano, no de IDs de proveedores hardcodeados.
3. Inventariar CTA/formularios por ruta y asignar claves estables: `hero-contact`,
   `pricing-contact`, `sticky-contact`. No nombres de personas ni respuestas.
4. Sustituir listeners paralelos por los helpers. No duplicar los eventos que
   `BacanoForm` ya conoce. Pasar `visible={open}` si permanece montado oculto.
5. Revisar GA4 Enhanced Measurement → Form interactions para evitar otra fuente
   de `form_start`. No cambiar cuentas remotas sin permiso.
6. Probar build estático, eventos únicos, preview y exclusiones. Confirmar
   recepción en cada proveedor por separado antes de afirmarla.

## Landing informativa

Dentro de los providers globales. `initialForm` puede obtenerse durante el build
mediante el cliente oficial para conservar Static First.

```tsx
"use client";
import { useBacanoCta } from "@bacano/sdk/react";
import { BacanoForm } from "@bacano/sdk/react/forms";
import type { WebsitePublishedForm } from "@bacano/sdk";

export function ContactSection({ initialForm }: { initialForm: WebsitePublishedForm }) {
  const track = useBacanoCta({
    ctaId: "hero-contact", placement: "hero", formKey: initialForm.key,
  });
  return <>
    <a href="#contact" onClick={track}>Hablemos de tu proyecto</a>
    <section id="contact">
      <BacanoForm formKey={initialForm.key} initialForm={initialForm} />
    </section>
  </>;
}
```

Un clic no emite otra apertura si el formulario ya estaba presentado. Para
modal/drawer pasar su estado `open` a `BacanoForm.visible`. El helper no gestiona
foco, animación ni navegación. Una preselección externa no cuenta como edición.

## Renderizador personalizado, incluido multipaso

`useBacanoFormTracking(formKey, { visible })` devuelve un controlador estable:

- `start()`: tras una edición real no vacía, nunca por focus o inicialización.
  No pasar el valor del campo al controlador.
- `stepComplete(step.key)`: únicamente tras validar y avanzar.
- `beginSubmit()`: antes de validar el envío final. Si devuelve false, ya existe
  un intento pendiente y no debe enviarse otra solicitud.
- `fail("validation" | "network" | "rejected" | "unavailable")`: termina ese
  intento. Nunca pasar `error.message` ni mensajes internos.
- `complete(result)`: pasar el resultado oficial tras verificar `accepted`.
  No registra éxito sin UUID de persistencia.

Este hook se conecta al renderer multipaso existente; no duplica definiciones
de campos ni opciones:

```tsx
import { useRef } from "react";
import { WebsiteError } from "@bacano/sdk";
import { useBacanoState } from "@bacano/sdk/react";
import { useBacanoForm, useBacanoFormTracking } from "@bacano/sdk/react/forms";
import type { BacanoFormValues } from "@bacano/sdk/react/forms";

export function useContactFlow(formKey: string, visible: boolean) {
  const { client } = useBacanoState();
  const definition = useBacanoForm(formKey);
  const tracking = useBacanoFormTracking(formKey, {
    visible: visible && definition.form?.status === "ACTIVE",
  });
  const submissionKey = useRef(crypto.randomUUID());
  async function submit(values: BacanoFormValues, valid: boolean) {
    if (!tracking.beginSubmit()) return;
    if (!valid) { tracking.fail("validation"); return; }
    if (!client || !definition.form) { tracking.fail("unavailable"); return; }
    try {
      const form = definition.form;
      const result = await client.forms.submitResponse({
        formKey: form.key, formVersion: form.version,
        definitionHash: form.definitionHash,
        idempotencyKey: submissionKey.current, values,
      });
      if (!result.accepted) { tracking.fail("rejected"); return result; }
      tracking.complete(result);
      return result;
    } catch (error) {
      tracking.fail(error instanceof WebsiteError && error.code === "NETWORK_ERROR"
        ? "network" : "rejected");
      throw error; // La UI ofrece reintento conservando datos y submissionKey.
    }
  }
  return { ...definition, tracking, submit };
}
```

El renderer lee `form.definition.steps`, secciones y campos oficiales. Tras
validar un avance llama a `tracking.stepComplete(step.key)`; al editar llama
a `tracking.start()` y al finalizar llama a `submit`. No usar este controlador
alrededor de `BacanoForm`, que ya posee esos eventos. Mantener una instancia por
formulario; si cambia su key, remontar el renderer.

## Tienda virtual

La medición comercial existente no cambia. Consultar un producto no significa
`add_to_cart`, ni completar un formulario equivale a `purchase`.

```tsx
"use client";
import { useState } from "react";
import { useBacanoCta } from "@bacano/sdk/react";
import { BacanoForm } from "@bacano/sdk/react/forms";

export function ProductInquiry() {
  const [open, setOpen] = useState(false);
  const track = useBacanoCta({
    ctaId: "product-inquiry", placement: "product_detail", formKey: "asesoria",
  });
  return <>
    <button onClick={() => { track(); setOpen(true); }}>Solicitar asesoría</button>
    <section hidden={!open} aria-label="Asesoría">
      <button onClick={() => setOpen(false)}>Cerrar</button>
      <BacanoForm formKey="asesoria" visible={open} />
    </section>
  </>;
}
```

## Evidencia requerida

- Una acción, un propietario; sin emisiones adicionales por renders.
- Abrir/cerrar/reabrir; edición manual frente a preselección programática.
- Validación fallida y error de red con reintento, sin falso éxito.
- Honeypot/aceptación genérica: mismo mensaje, sin conversión.
- `utm_content` y demás atribución después de navegación interna.
- Preview, marketing desactivado y consentimiento pendiente: sin emisiones.
- Proveedores bloqueados: formulario y navegación siguen funcionando.
- Separar prueba automatizada, transporte y panel del proveedor. No afirmar
  un embudo completo dentro de Bacano: se instrumentan interacciones externas
  y se conserva la atribución de las respuestas oficiales.

import type {
  WebsiteLegalPublicConfig,
  WebsitePublicConfig,
} from "@bacano/sdk";

export type LegalDocumentKey = keyof WebsiteLegalPublicConfig["documents"];

export type LegalRouteDefinition = {
  documentKey: LegalDocumentKey;
  eyebrow: string;
  href: string;
  title: string;
};

export const legalRoutes = {
  "/terminos-y-condiciones": {
    documentKey: "terms",
    eyebrow: "Legal",
    href: "/terminos-y-condiciones",
    title: "Terminos y condiciones",
  },
  "/privacidad": {
    documentKey: "privacy",
    eyebrow: "Privacidad",
    href: "/privacidad",
    title: "Politica de privacidad",
  },
  "/politica-cookies": {
    documentKey: "cookies",
    eyebrow: "Cookies",
    href: "/politica-cookies",
    title: "Política de cookies",
  },
  "/politicas-envio": {
    documentKey: "shipping",
    eyebrow: "Envíos",
    href: "/politicas-envio",
    title: "Políticas de envío",
  },
  "/cambios-y-devoluciones": {
    documentKey: "returns",
    eyebrow: "Soporte",
    href: "/cambios-y-devoluciones",
    title: "Cambios y devoluciones",
  },
} as const satisfies Record<string, LegalRouteDefinition>;

export function getLegalDocument(
  config: WebsitePublicConfig | null | undefined,
  documentKey: LegalDocumentKey,
) {
  return config?.legal?.documents[documentKey] ?? null;
}

export function getCookieNoticeStorageKey(
  config: WebsitePublicConfig,
): string | null {
  if (!config.legal) return null;

  const revision = config.legal.contentHash ?? String(config.legal.version);
  return `bacano:legal:cookie-notice:${config.websiteId}:${revision}`;
}

export function getInquiriesChannelHref(channel: string | null) {
  if (!channel) return null;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel)) {
    return `mailto:${channel}`;
  }

  if (/^https:\/\//i.test(channel)) return channel;
  if (/^tel:\+[1-9]\d{6,14}$/i.test(channel)) return channel;

  return null;
}

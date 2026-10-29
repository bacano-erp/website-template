import type { WebsitePublicConfig } from "@bacano/sdk";
import { getWebsiteContextFromPublicConfig } from "@bacano/sdk";

const CLERK_ROUTE_PREFIXES = [
  "/checkout",
  "/crear-cuenta",
  "/mi-cuenta",
  "/mis-pedidos",
  "/pago/respuesta",
  "/pedido",
  "/sso-callback",
] as const;

export function requiresClerkRuntime(pathname: string): boolean {
  return CLERK_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canLoadClerkAtOrigin({
  publishableKey,
  websiteDomain,
  origin,
}: {
  publishableKey: string;
  websiteDomain: string | null | undefined;
  origin: string;
}): boolean {
  if (!publishableKey.startsWith("pk_live_")) return true;

  const originHostname = getHostname(origin);
  const websiteHostname = getHostname(websiteDomain);

  if (!originHostname || !websiteHostname) return false;

  return (
    originHostname === websiteHostname ||
    originHostname.endsWith(`.${websiteHostname}`)
  );
}

function getHostname(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function toBacanoInitialContext(
  config: WebsitePublicConfig | null,
): ReturnType<typeof getWebsiteContextFromPublicConfig> | undefined {
  if (!config) return undefined;
  return getWebsiteContextFromPublicConfig(config);
}

export function publicConfigsMatch(
  current: WebsitePublicConfig | null,
  next: WebsitePublicConfig,
): boolean {
  return current !== null && JSON.stringify(current) === JSON.stringify(next);
}

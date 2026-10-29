const DEFAULT_RETURN_TO = "/mi-cuenta";

const allowedReturnPrefixes = ["/mi-cuenta", "/mis-pedidos", "/checkout"];

export function getSafeReturnTo(value?: string | null) {
  if (!value) return DEFAULT_RETURN_TO;

  let decodedValue = value;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    decodedValue = value;
  }

  if (!decodedValue.startsWith("/") || decodedValue.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(decodedValue)) {
    return DEFAULT_RETURN_TO;
  }

  const [path] = decodedValue.split(/[?#]/);
  const isAllowed = allowedReturnPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return isAllowed ? decodedValue : DEFAULT_RETURN_TO;
}

export function buildAuthPath({
  mode = "sign-up",
  returnTo,
}: {
  mode?: "sign-in" | "sign-up";
  returnTo?: string | null;
}) {
  const params = new URLSearchParams({
    mode,
    returnTo: getSafeReturnTo(returnTo),
  });

  return `/crear-cuenta?${params.toString()}`;
}

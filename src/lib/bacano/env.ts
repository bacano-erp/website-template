export type BacanoEnv = {
  apiUrl: string;
  websiteSlug: string;
};

export function getBacanoEnv(): BacanoEnv {
  const apiUrl = process.env.NEXT_PUBLIC_BACANO_API_URL;
  const websiteSlug = process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG;

  if (!apiUrl || !websiteSlug) {
    throw new Error(
      "Faltan variables de entorno Bacano: NEXT_PUBLIC_BACANO_API_URL y NEXT_PUBLIC_BACANO_WEBSITE_SLUG",
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    websiteSlug,
  };
}

export function getBacanoStorageUrl() {
  return `${getBacanoEnv().apiUrl}/storage/v1`;
}

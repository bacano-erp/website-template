/**
 * Which category and attribute lists this storefront builds from.
 *
 * Both are configured per website in the ERP, under Sitios web → Listas de
 * categorías / Listas de atributos, and the keys are chosen there. They decide
 * which categories appear in navigation and which attributes become filters —
 * a store that sells clothing filters by size and colour, one that sells tools
 * does not.
 *
 * They are a build input rather than an environment variable because changing
 * them changes the pages that get generated, and that belongs in a commit
 * someone reviewed.
 */
export const bacanoListKeys = {
  catalogCategories: "categorias-web",
  catalogAttributes: "atributos",
} as const;

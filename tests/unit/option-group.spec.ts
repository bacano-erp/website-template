import type {
  Product,
  ProductMedia,
  ProductOptionGroupMember,
} from "@bacano/sdk";
import { expect, test } from "@playwright/test";

import { getOptionGroupView } from "../../src/lib/option-group";

const media = (name: string): ProductMedia[] =>
  [
    {
      id: `media-${name}`,
      order: 0,
      mediaKind: "image",
      thumbnailUrl: `https://cdn.example.com/${name}-thumb.webp`,
    },
  ] as unknown as ProductMedia[];

const member = (
  productId: string,
  overrides: Partial<ProductOptionGroupMember> = {},
): ProductOptionGroupMember => ({
  id: `member-${productId}`,
  productId,
  slug: productId,
  name: `Producto ${productId}`,
  sku: null,
  displayLabel: null,
  sortOrder: 0,
  media: media(productId),
  ...overrides,
});

const product = (
  id: string,
  members: ProductOptionGroupMember[] | null,
  title: string | null = "Color",
): Product =>
  ({
    id,
    media: media(`${id}-own`),
    optionGroup: members ? { id: "group-1", title, members } : null,
  }) as unknown as Product;

test("shows nothing without a group or with only the product itself", () => {
  expect(getOptionGroupView(product("rojo", null))).toBeNull();
  expect(getOptionGroupView(product("rojo", [member("rojo")]))).toBeNull();
});

test("lists the members in Bacano's order with their labels", () => {
  const view = getOptionGroupView(
    product("rojo", [
      member("azul", { sortOrder: 2, displayLabel: "  Azul  " }),
      member("rojo", { sortOrder: 0 }),
      member("verde", { sortOrder: 1 }),
    ]),
  );

  expect(view?.title).toBe("Color");
  expect(view?.choices.map((choice) => choice.label)).toEqual([
    "Producto rojo",
    "Producto verde",
    "Azul",
  ]);
});

test("links other members to their page and never the current one", () => {
  const view = getOptionGroupView(
    product("rojo", [member("rojo"), member("azul", { sortOrder: 1 })]),
  );

  expect(view?.choices).toMatchObject([
    { label: "Producto rojo", isCurrent: true, href: null },
    { label: "Producto azul", isCurrent: false, href: "/producto/azul/" },
  ]);
});

test("does not link a member that is not published on this website", () => {
  const view = getOptionGroupView(
    product("rojo", [member("rojo"), member("azul", { slug: null })]),
  );

  expect(view?.choices[1]).toMatchObject({ isCurrent: false, href: null });
});

test("uses the product's own image when its member entry has none", () => {
  const view = getOptionGroupView(
    product("rojo", [
      member("rojo", { media: [] }),
      member("azul", { media: [] }),
    ]),
  );

  expect(view?.choices.map((choice) => choice.thumbnailUrl)).toEqual([
    "https://cdn.example.com/rojo-own-thumb.webp",
    null,
  ]);
});

test("titles an untitled group Opciones", () => {
  const view = getOptionGroupView(
    product("rojo", [member("rojo"), member("azul")], "  "),
  );

  expect(view?.title).toBe("Opciones");
});

import { expect, test } from "@playwright/test";

import { createSerializedTaskQueue } from "../../src/features/commerce/cart/serialized-task-queue";

test("dos inicios simultáneos reutilizan el carrito creado por el primero", async () => {
  const enqueue = createSerializedTaskQueue();
  const calls: Array<string | null> = [];
  let cartToken: string | null = null;

  const startCheckout = () =>
    enqueue(async () => {
      calls.push(cartToken);
      await Promise.resolve();
      cartToken ??= "existing-cart-token";
      return cartToken;
    });

  const [first, second] = await Promise.all([startCheckout(), startCheckout()]);

  expect(first).toBe("existing-cart-token");
  expect(second).toBe("existing-cart-token");
  expect(calls).toEqual([null, "existing-cart-token"]);
});

test("un error no bloquea el siguiente intento de checkout", async () => {
  const enqueue = createSerializedTaskQueue();
  const failed = enqueue(async () => {
    throw new Error("Fallo temporal");
  });
  const retried = enqueue(async () => "carrito reutilizado");

  await expect(failed).rejects.toThrow(/Fallo temporal/);
  expect(await retried).toBe("carrito reutilizado");
});

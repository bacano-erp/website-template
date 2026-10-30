import { expect, test } from "@playwright/test";

import {
  formatDeliveryOrderCountdown,
  formatEstimatedDeliveryDate,
  getEstimatedDeliveryDate,
  getStorePickupDayLabel,
} from "../../src/features/commerce/delivery-estimate";

test("suma tres días hábiles sin contar el fin de semana", () => {
  const thursdayInBogota = new Date("2026-08-27T15:00:00.000Z");
  const result = getEstimatedDeliveryDate(thursdayInBogota);

  expect(result.toISOString()).toBe("2026-09-01T00:00:00.000Z");
});

test("calcula desde la fecha vigente en Bogotá", () => {
  const lateSundayUtcButSaturdayInBogota = new Date("2026-08-30T03:30:00.000Z");
  const result = getEstimatedDeliveryDate(lateSundayUtcButSaturdayInBogota);

  expect(result.toISOString()).toBe("2026-09-02T00:00:00.000Z");
});

test("presenta una fecha legible en español", () => {
  const date = new Date("2026-09-02T00:00:00.000Z");

  expect(formatEstimatedDeliveryDate(date)).toBe("miércoles, 2 de septiembre");
});

test("calcula la cuenta regresiva hacia el primer corte del mediodía", () => {
  expect(
    formatDeliveryOrderCountdown(new Date("2026-08-31T14:30:00.000Z")),
  ).toBe("02 h 30 min 00 s");
  expect(
    formatDeliveryOrderCountdown(new Date("2026-08-31T16:49:59.000Z")),
  ).toBe("00 h 10 min 01 s");
});

test("cambia al corte de las 3:45 p. m. diez minutos antes del mediodía", () => {
  expect(
    formatDeliveryOrderCountdown(new Date("2026-08-31T16:50:00.000Z")),
  ).toBe("03 h 55 min 00 s");
  expect(
    formatDeliveryOrderCountdown(new Date("2026-08-31T20:44:59.000Z")),
  ).toBe("00 h 00 min 01 s");
});

test("después del segundo corte cuenta hacia el mediodía siguiente", () => {
  expect(
    formatDeliveryOrderCountdown(new Date("2026-08-31T20:45:00.000Z")),
  ).toBe("20 h 15 min 00 s");
});

test("permite retiro hoy hasta las 5:30 p. m. en Bogotá", () => {
  expect(getStorePickupDayLabel(new Date("2026-08-31T22:30:00.000Z"))).toBe(
    "hoy",
  );
  expect(getStorePickupDayLabel(new Date("2026-08-31T22:31:00.000Z"))).toBe(
    "mañana",
  );
});

test("omite el domingo al calcular el próximo retiro", () => {
  expect(getStorePickupDayLabel(new Date("2026-09-05T22:31:00.000Z"))).toBe(
    "el lunes",
  );
  expect(getStorePickupDayLabel(new Date("2026-09-06T17:00:00.000Z"))).toBe(
    "mañana",
  );
});

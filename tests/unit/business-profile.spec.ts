import { expect, test } from "@playwright/test";

import { openingHoursLines } from "../../src/features/business/opening-hours";
import { whatsAppLink } from "../../src/features/business/whatsapp";

const range = (
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  opensAt: string,
  closesAt: string,
) => ({
  weekday,
  opensAt,
  closesAt,
});

test("joins weekdays with the same hours", () => {
  expect(
    openingHoursLines({
      openingHours: [
        range(1, "09:00", "18:00"),
        range(2, "09:00", "18:00"),
        range(3, "09:00", "18:00"),
        range(4, "09:00", "18:00"),
        range(5, "09:00", "18:00"),
        range(6, "10:00", "14:00"),
      ],
    }),
  ).toEqual([
    { days: "Lunes a viernes", hours: "9:00 – 18:00" },
    { days: "Sábado", hours: "10:00 – 14:00" },
    { days: "Domingo", hours: "Cerrado" },
  ]);
});

test("shows split days and no hours when there are none on record", () => {
  expect(
    openingHoursLines({
      openingHours: [
        range(1, "08:00", "12:00"),
        range(1, "14:00", "18:00"),
        range(2, "08:00", "12:00"),
        range(2, "14:00", "18:00"),
      ],
    })[0],
  ).toEqual({ days: "Lunes y martes", hours: "8:00 – 12:00 y 14:00 – 18:00" });
  expect(openingHoursLines({ openingHours: [] })).toEqual([]);
});

test("links WhatsApp only when the business has it", () => {
  expect(whatsAppLink(null, "Hola")).toBeNull();
  expect(whatsAppLink({ href: null }, "Hola")).toBeNull();
  expect(
    whatsAppLink({ href: "https://wa.me/573001234567" }, "Hola, ¿precio?"),
  ).toBe("https://wa.me/573001234567?text=Hola%2C%20%C2%BFprecio%3F");
  expect(whatsAppLink({ href: "https://wa.me/573001234567" })).toBe(
    "https://wa.me/573001234567",
  );
});

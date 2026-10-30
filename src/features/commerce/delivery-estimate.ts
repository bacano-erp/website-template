const BOGOTA_TIME_ZONE = "America/Bogota";
const NOON_ORDER_CUTOFF_SECONDS = 12 * 60 * 60;
const AFTERNOON_ORDER_CUTOFF_SECONDS = (15 * 60 + 45) * 60;
const NOON_CUTOFF_ROLLOVER_SECONDS = NOON_ORDER_CUTOFF_SECONDS - 10 * 60;
const PICKUP_CUTOFF_MINUTES = 17 * 60 + 30;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

type CalendarDateTime = CalendarDate & {
  hour: number;
  minute: number;
  second: number;
};

export function getEstimatedDeliveryDate(now: Date, businessDays = 3): Date {
  const currentDate = getCalendarDate(now, BOGOTA_TIME_ZONE);
  const cursor = new Date(
    Date.UTC(currentDate.year, currentDate.month - 1, currentDate.day),
  );
  let remainingDays = Math.max(0, Math.trunc(businessDays));

  while (remainingDays > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const weekday = cursor.getUTCDay();

    if (weekday !== 0 && weekday !== 6) {
      remainingDays -= 1;
    }
  }

  return cursor;
}

export function formatEstimatedDeliveryDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function formatDeliveryOrderCountdown(now: Date) {
  const { hour, minute, second } = getCalendarDateTime(now, BOGOTA_TIME_ZONE);
  const currentSeconds = hour * 60 * 60 + minute * 60 + second;
  let targetCutoffSeconds: number;

  if (currentSeconds < NOON_CUTOFF_ROLLOVER_SECONDS) {
    targetCutoffSeconds = NOON_ORDER_CUTOFF_SECONDS;
  } else if (currentSeconds < AFTERNOON_ORDER_CUTOFF_SECONDS) {
    targetCutoffSeconds = AFTERNOON_ORDER_CUTOFF_SECONDS;
  } else {
    targetCutoffSeconds = 24 * 60 * 60 + NOON_ORDER_CUTOFF_SECONDS;
  }

  const remainingSeconds = targetCutoffSeconds - currentSeconds;
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return `${padTime(hours)} h ${padTime(minutes)} min ${padTime(seconds)} s`;
}

export function getStorePickupDayLabel(now: Date) {
  const current = getCalendarDateTime(now, BOGOTA_TIME_ZONE);
  const currentDate = new Date(
    Date.UTC(current.year, current.month - 1, current.day),
  );
  const weekday = currentDate.getUTCDay();
  const currentMinutes = current.hour * 60 + current.minute;

  if (weekday !== 0 && currentMinutes <= PICKUP_CUTOFF_MINUTES) {
    return "hoy";
  }

  let daysUntilPickup = 1;
  const pickupDate = new Date(currentDate);
  pickupDate.setUTCDate(pickupDate.getUTCDate() + daysUntilPickup);

  while (pickupDate.getUTCDay() === 0) {
    daysUntilPickup += 1;
    pickupDate.setUTCDate(currentDate.getUTCDate() + daysUntilPickup);
  }

  if (daysUntilPickup === 1) return "mañana";

  const weekdayName = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    timeZone: "UTC",
  }).format(pickupDate);

  return `el ${weekdayName}`;
}

function getCalendarDate(date: Date, timeZone: string): CalendarDate {
  const { year, month, day } = getCalendarDateTime(date, timeZone);

  return { year, month, day };
}

function getCalendarDateTime(date: Date, timeZone: string): CalendarDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

export const formFieldClass = "grid gap-1";

export const formLabelClass =
  "text-[11px] font-medium uppercase leading-3 tracking-[0.08em] text-muted";

export const formInputClass =
  "h-10 w-full rounded-md border border-border bg-white px-3 text-base font-normal normal-case leading-[1.25] tracking-normal text-foreground shadow-none outline-none transition placeholder:font-normal placeholder:text-muted hover:border-border focus:border-accent focus:ring-2 focus:ring-accent/15 sm:text-[14px]";

export const formSelectTriggerClass =
  "inline-flex h-10 w-full items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-[14px] font-normal leading-[1.25] text-foreground shadow-none outline-none transition hover:border-border focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15";

export const formDividerClass = "border-t border-border pt-5";

export const formQuantityStepperClass =
  "grid h-12 w-[150px] grid-cols-[40px_1fr_40px] overflow-hidden rounded-md border border-border bg-white";

export const formQuantityButtonClass =
  "grid place-items-center text-muted transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-35";

export const formQuantityInputClass =
  "min-w-0 border-0 bg-white px-2 text-center text-[15px] font-medium text-foreground outline-none disabled:cursor-not-allowed disabled:bg-surface-secondary";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

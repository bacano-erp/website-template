import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { formLabelClass } from "./styles";

type FormAccordionProps = {
  children: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  title: string;
};

export function FormAccordion({
  children,
  count,
  defaultOpen,
  title,
}: FormAccordionProps) {
  return (
    <details
      className="group border-border border-t"
      open={defaultOpen || undefined}
    >
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md px-0 outline-none transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden ${formLabelClass}`}
      >
        <span>{title}</span>
        <span className="flex items-center gap-2">
          {count ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-accent-soft px-1.5 py-0.5 font-medium text-[11px] text-accent leading-none tracking-normal">
              {count}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className="transition group-open:rotate-180"
            size={16}
          />
        </span>
      </summary>
      <div className="flex flex-wrap gap-2 pt-0 pb-2">{children}</div>
    </details>
  );
}

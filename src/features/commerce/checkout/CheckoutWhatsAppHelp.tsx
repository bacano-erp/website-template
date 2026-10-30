export function CheckoutWhatsAppHelp({
  href,
  onClick,
}: {
  href: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-md bg-surface-secondary px-4 py-3 text-center font-medium text-muted text-sm leading-5 transition hover:bg-surface-secondary hover:text-foreground"
    >
      <MessageCircle
        aria-hidden="true"
        size={19}
        className="shrink-0 text-success"
      />
      <span className="whitespace-nowrap">
        ¿Necesitas ayuda? Escribenos por WhatsApp
      </span>
    </a>
  );
}

import { MessageCircle } from "lucide-react";

"use client";

import type { ReactNode } from "react";

import { storeConfig } from "@/config/store";

import { useWhatsAppLink } from "./business-profile";

/**
 * A link to the business's WhatsApp (from its Ficha pública in Bacano), or
 * nothing when it has none.
 */
export function WhatsAppHelpLink({
  message = storeConfig.contact.whatsappMessage,
  className,
  children,
  onClick,
}: {
  message?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const href = useWhatsAppLink(message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

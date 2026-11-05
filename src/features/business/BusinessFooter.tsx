"use client";

import type { BusinessBranch, BusinessSocialNetwork } from "@bacano/sdk";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { useBusinessProfile } from "./business-profile";
import { openingHoursLines } from "./opening-hours";

const NETWORK_NAMES: Record<BusinessSocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  other: "Sitio",
};

/**
 * Contact, social networks and the store's hours, from the business's Ficha
 * pública in Bacano. Each part shows only when the business filled it in;
 * with nothing filled in, the footer shows nothing extra.
 */
export function BusinessFooter() {
  const profile = useBusinessProfile();
  if (!profile) return null;

  const contacts = [profile.whatsapp, profile.phone, profile.email].filter(
    (contact) => contact?.href,
  );
  const branch =
    profile.branches.find((item) => item.isWebsiteBranch) ??
    profile.branches[0];
  const hours = branch ? openingHoursLines(branch) : [];
  const hasAddress = Boolean(branch?.address);

  if (
    contacts.length === 0 &&
    profile.socialLinks.length === 0 &&
    hours.length === 0 &&
    !hasAddress
  ) {
    return null;
  }

  return (
    <div className="grid gap-6 text-sm sm:grid-cols-3">
      {contacts.length > 0 ? (
        <section aria-label="Contacto" className="grid content-start gap-2">
          <h2 className="font-semibold text-foreground">Contacto</h2>
          {contacts.map((contact) =>
            contact?.href ? (
              <a
                key={`${contact.kind}-${contact.value}`}
                href={contact.href}
                target={contact.kind === "whatsapp" ? "_blank" : undefined}
                rel={contact.kind === "whatsapp" ? "noreferrer" : undefined}
                className="flex items-center gap-2 text-muted hover:text-foreground"
              >
                {contact.kind === "whatsapp" ? (
                  <MessageCircle aria-hidden="true" size={16} />
                ) : contact.kind === "phone" ? (
                  <Phone aria-hidden="true" size={16} />
                ) : (
                  <Mail aria-hidden="true" size={16} />
                )}
                {contact.value}
              </a>
            ) : null,
          )}
        </section>
      ) : null}

      {branch && (hours.length > 0 || hasAddress) ? (
        <BranchBlock branch={branch} hours={hours} />
      ) : null}

      {profile.socialLinks.length > 0 ? (
        <section
          aria-label="Redes sociales"
          className="grid content-start gap-2"
        >
          <h2 className="font-semibold text-foreground">Síguenos</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {profile.socialLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-foreground"
                >
                  {NETWORK_NAMES[link.network] ?? link.network}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BranchBlock({
  branch,
  hours,
}: {
  branch: BusinessBranch;
  hours: ReturnType<typeof openingHoursLines>;
}) {
  return (
    <section
      aria-label="Horarios y ubicación"
      className="grid content-start gap-2"
    >
      <h2 className="font-semibold text-foreground">{branch.name}</h2>
      {branch.address ? (
        <p className="flex items-start gap-2 text-muted">
          <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          {[branch.address, branch.municipalityName].filter(Boolean).join(", ")}
        </p>
      ) : null}
      {hours.length > 0 ? (
        <div className="flex items-start gap-2 text-muted">
          <Clock aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          <dl className="grid gap-1">
            {hours.map((line) => (
              <div key={line.days} className="flex flex-wrap gap-x-2">
                <dt>{line.days}</dt>
                <dd>{line.hours}</dd>
              </div>
            ))}
            {branch.closedOnPublicHolidays ? (
              <div>
                <dt className="sr-only">Festivos</dt>
                <dd>Festivos: cerrado</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </section>
  );
}

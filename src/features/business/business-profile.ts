"use client";

import type { BusinessProfile } from "@bacano/sdk";
import { useEffect, useState } from "react";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import { whatsAppLink } from "./whatsapp";

// WhatsApp, phones, emails, social networks, branches and opening hours come
// from the business's Ficha pública in Bacano, never from this repository.
// Contract: @bacano/sdk STOREFRONT_BUSINESS_PROFILE.md.

let profileRequest: Promise<BusinessProfile | null> | null = null;

/** The profile once per page load; null when Bacano cannot answer. */
export function loadBusinessProfile(): Promise<BusinessProfile | null> {
  profileRequest ??= getBacanoBrowserClient()
    .then((client) => client.business.getProfile())
    .catch(() => {
      profileRequest = null;
      return null;
    });
  return profileRequest;
}

/**
 * The business profile, or null while it loads or if it fails. Every block
 * built on it hides itself when its data is missing.
 */
export function useBusinessProfile(): BusinessProfile | null {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    let isActive = true;
    loadBusinessProfile().then((next) => {
      if (isActive) setProfile(next);
    });
    return () => {
      isActive = false;
    };
  }, []);

  return profile;
}

/**
 * The business's WhatsApp link with a message, or null when it has no
 * WhatsApp in its Ficha pública (then no WhatsApp help is offered).
 */
export function useWhatsAppLink(message?: string): string | null {
  const profile = useBusinessProfile();
  return whatsAppLink(profile?.whatsapp, message);
}

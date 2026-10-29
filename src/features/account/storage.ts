import { getSafeReturnTo } from "./return-to";

export type PendingAuthProfile = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  returnTo?: string;
  source: "account" | "checkout";
};

const pendingProfileKey = "bacano:pending-auth-profile";

export function savePendingAuthProfile(profile: PendingAuthProfile) {
  if (typeof window === "undefined") return;

  const safeProfile: PendingAuthProfile = {
    email: clean(profile.email),
    firstName: clean(profile.firstName),
    lastName: clean(profile.lastName),
    phone: clean(profile.phone),
    returnTo: getSafeReturnTo(profile.returnTo),
    source: profile.source,
  };

  window.sessionStorage.setItem(pendingProfileKey, JSON.stringify(safeProfile));
}

export function readPendingAuthProfile() {
  if (typeof window === "undefined") return null;

  const rawValue = window.sessionStorage.getItem(pendingProfileKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as PendingAuthProfile;

    return {
      email: clean(parsed.email),
      firstName: clean(parsed.firstName),
      lastName: clean(parsed.lastName),
      phone: clean(parsed.phone),
      returnTo: getSafeReturnTo(parsed.returnTo),
      source: parsed.source === "checkout" ? "checkout" : "account",
    } satisfies PendingAuthProfile;
  } catch {
    window.sessionStorage.removeItem(pendingProfileKey);
    return null;
  }
}

export function clearPendingAuthProfile() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(pendingProfileKey);
}

function clean(value?: string) {
  return value?.trim() || undefined;
}

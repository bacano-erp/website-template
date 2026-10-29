import {
  getBacanoAccessToken,
  getBacanoBrowserClient,
} from "@/lib/bacano/browser-client";

import {
  clearPendingAuthProfile,
  type PendingAuthProfile,
  readPendingAuthProfile,
} from "./storage";

type SyncProfileInput = {
  firstName?: string;
  lastName?: string;
  cellphone?: string;
};

export async function syncBacanoBuyerProfile(input: SyncProfileInput) {
  const payload = {
    name: clean(input.firstName),
    lastname: clean(input.lastName),
    cellphone: clean(input.cellphone),
  };

  if (!Object.values(payload).some(Boolean)) return;

  const token = await getBacanoAccessToken();
  if (!token) return;

  const client = await getBacanoBrowserClient();
  await client.profile.update(payload);
}

export async function syncPendingAuthProfile(
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    primaryEmailAddress?: { emailAddress?: string | null } | null;
  } | null,
) {
  const pending = readPendingAuthProfile();
  if (!pending) return;

  await syncBacanoBuyerProfile(resolveProfilePayload(pending, user));
  clearPendingAuthProfile();
}

function resolveProfilePayload(
  pending: PendingAuthProfile,
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    primaryEmailAddress?: { emailAddress?: string | null } | null;
  } | null,
) {
  return {
    firstName: pending.firstName ?? user?.firstName ?? undefined,
    lastName: pending.lastName ?? user?.lastName ?? undefined,
    cellphone: pending.phone,
  };
}

function clean(value?: string | null) {
  return value?.trim() || undefined;
}

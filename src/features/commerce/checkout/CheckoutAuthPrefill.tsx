"use client";

import type { CustomerProfile } from "@bacano/sdk";
import { useAuth, useUser } from "@clerk/react";
import { useEffect, useRef, useState } from "react";

import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";
import { readPendingAuthProfile } from "@/features/account/storage";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import type { CheckoutFormState } from "./types";

type CheckoutAuthPrefillProps = {
  form: CheckoutFormState;
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
};

export function CheckoutAuthPrefill(props: CheckoutAuthPrefillProps) {
  const accounts = useBuyerAccounts();

  if (accounts.loading || !accounts.enabled) return null;

  return <CheckoutAuthPrefillInner {...props} />;
}

function CheckoutAuthPrefillInner({
  form,
  onFieldChange,
}: CheckoutAuthPrefillProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [profileState, setProfileState] = useState<{
    profile: CustomerProfile | null;
    userId: string;
  }>({ profile: null, userId: "" });
  const didPrefillContactRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      didPrefillContactRef.current = false;
      return;
    }

    let isCancelled = false;
    const userId = user.id;

    async function loadProfile() {
      try {
        const client = await getBacanoBrowserClient();
        const nextProfile = await client.profile.get();

        if (!isCancelled) {
          setProfileState({ profile: nextProfile, userId });
        }
      } catch {
        if (!isCancelled) {
          setProfileState({ profile: null, userId });
        }
      }
    }

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (
      didPrefillContactRef.current ||
      !isLoaded ||
      !userLoaded ||
      !isSignedIn ||
      !user?.id ||
      profileState.userId !== user.id
    ) {
      return;
    }

    const profile = profileState.profile;
    const pending = readPendingAuthProfile();
    if (pending?.source !== "checkout" && !user && !profile) return;

    didPrefillContactRef.current = true;

    const values: Partial<CheckoutFormState> = {
      email:
        profile?.email ??
        pending?.email ??
        user?.primaryEmailAddress?.emailAddress ??
        undefined,
      firstName:
        profile?.name ?? pending?.firstName ?? user?.firstName ?? undefined,
      lastName:
        profile?.lastname ?? pending?.lastName ?? user?.lastName ?? undefined,
      phone:
        profile?.cellphone ?? profile?.phone ?? pending?.phone ?? undefined,
    };

    (Object.entries(values) as Array<[keyof CheckoutFormState, string]>)
      .filter(([, value]) => Boolean(value))
      .forEach(([field, value]) => {
        if (field !== "phone" || !form[field]?.trim()) {
          onFieldChange(field, value);
        }
      });
  }, [
    form,
    isLoaded,
    isSignedIn,
    onFieldChange,
    profileState,
    user,
    userLoaded,
  ]);

  return null;
}

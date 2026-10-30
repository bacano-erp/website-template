"use client";

import { useAuth, useUser } from "@clerk/react";
import { useEffect, useRef } from "react";

import { syncPendingAuthProfile } from "@/features/account/profile-sync";

export function PostAuthProfileSync() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const syncKeyRef = useRef("");

  useEffect(() => {
    if (!isLoaded || !userLoaded || !isSignedIn || !user) return;

    const syncKey = `${user.id}:${user.primaryEmailAddress?.emailAddress ?? ""}`;
    if (syncKeyRef.current === syncKey) return;
    syncKeyRef.current = syncKey;

    async function syncProfileWhenTokenIsReady() {
      const token = await getToken();
      if (!token) {
        syncKeyRef.current = "";
        return;
      }

      await syncPendingAuthProfile(user);
    }

    syncProfileWhenTokenIsReady().catch(() => {
      syncKeyRef.current = "";
    });
  }, [getToken, isLoaded, isSignedIn, user, userLoaded]);

  return null;
}

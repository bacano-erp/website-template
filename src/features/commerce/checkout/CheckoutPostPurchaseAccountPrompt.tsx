"use client";

import { useAuth } from "@clerk/react";
import { UserPlus } from "lucide-react";
import Link from "next/link";

import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";

export function CheckoutPostPurchaseAccountPrompt() {
  const accounts = useBuyerAccounts();

  if (accounts.loading || !accounts.enabled) return null;

  return <PostPurchaseAccountPrompt />;
}

function PostPurchaseAccountPrompt() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="grid gap-3 rounded-md border border-accent-soft bg-accent-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center text-accent">
          <UserPlus aria-hidden="true" size={21} strokeWidth={2} />
        </span>
        <span>
          <span className="block font-medium text-foreground text-sm">
            Compra mas rapido la proxima vez
          </span>
          <span className="mt-1 block text-muted text-sm leading-5">
            Crea tu cuenta para guardar tus datos y consultar tus proximos
            pedidos.
          </span>
        </span>
      </div>
      <Link
        href="/crear-cuenta?returnTo=%2Fmis-pedidos"
        className="btn btn-secondary w-full"
      >
        Crear mi cuenta
      </Link>
    </div>
  );
}

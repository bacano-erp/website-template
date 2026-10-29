import { Lock, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { storeConfig } from "@/config/store";

export function CheckoutHeader() {
  return (
    <header className="border-border border-b bg-white">
      <div className="container-page flex min-h-[72px] items-center justify-between gap-4 py-2 sm:min-h-[86px] sm:py-3">
        <Link
          href="/"
          className="relative block h-[50px] w-[126px] shrink-0 sm:h-[66px] sm:w-[166px]"
          aria-label={`${storeConfig.name}, inicio`}
        >
          {storeConfig.logo ? (
            <Image
              src={storeConfig.logo}
              alt={storeConfig.name}
              fill
              priority
              sizes="166px"
              referrerPolicy="no-referrer"
              className="object-contain"
            />
          ) : (
            <span className="flex h-full items-center font-semibold text-foreground text-lg">
              {storeConfig.name}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-5 font-normal text-[13px] text-muted sm:flex">
          <span className="inline-flex items-center gap-2">
            <Lock aria-hidden="true" className="text-accent" size={17} />
            Compra segura
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck aria-hidden="true" className="text-accent" size={18} />
            Envio coordinado
          </span>
        </div>
      </div>
    </header>
  );
}

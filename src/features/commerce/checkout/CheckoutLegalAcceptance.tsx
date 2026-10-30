"use client";

import { Modal, useOverlayState } from "@heroui/react";
import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BacanoRichText } from "@/components/content/BacanoRichText";
import { storeConfig } from "@/config/store";
import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";
import {
  getLegalDocument,
  type LegalDocumentKey,
} from "@/features/legal/legal";
import { readRichTextDocuments } from "@/lib/bacano/rich-text";

export function CheckoutLegalAcceptance({
  checked,
  onChange,
  advertisingStatement,
  errorMessage,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  advertisingStatement?: string | null;
  errorMessage?: string;
}) {
  const { loading: isPublicConfigLoading, website } = useBuyerAccounts();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const legalSections = LEGAL_MODAL_SECTIONS.map((section) => ({
    ...section,
    documents: readRichTextDocuments(
      getLegalDocument(website, section.documentKey),
    ),
  }));
  const state = useOverlayState({
    isOpen: isLegalModalOpen,
    onOpenChange: setIsLegalModalOpen,
  });

  function openModal() {
    setIsLegalModalOpen(true);
  }

  function closeModal() {
    setIsLegalModalOpen(false);
  }

  return (
    <>
      <div
        className={
          errorMessage
            ? "grid gap-1 rounded-md border border-danger bg-danger-soft p-3"
            : "grid gap-1"
        }
      >
        <div className="flex items-start gap-3">
          <input
            id="checkout-legal-acceptance"
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={Boolean(errorMessage)}
            className="mt-1 size-5 shrink-0 rounded border-border text-accent accent-accent"
          />
          <span className="text-muted text-sm leading-6">
            <label
              htmlFor="checkout-legal-acceptance"
              className="cursor-pointer"
            >
              Acepto los{" "}
            </label>
            <LegalDocumentButton onClick={openModal}>
              términos y políticas de compra
            </LegalDocumentButton>
            .
          </span>
        </div>
        {errorMessage ? (
          <p className="pl-8 font-medium text-danger text-xs">{errorMessage}</p>
        ) : null}
      </div>

      <Modal state={state}>
        <Modal.Backdrop
          isDismissable
          className="fixed inset-0 z-[80] grid place-items-center bg-foreground/42 px-4 py-8 backdrop-blur-[3px]"
        >
          <Modal.Container placement="center" size="md">
            <Modal.Dialog className="relative h-[calc(100dvh-64px)] max-h-[720px] max-w-[680px] overflow-hidden p-0 outline-none">
              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
                <Modal.Header className="relative border-border border-b p-6 pr-14 sm:px-7 sm:py-6">
                  <p className="font-medium text-warning text-xs uppercase tracking-[0.16em]">
                    {storeConfig.name}
                  </p>
                  <Modal.Heading className="mt-2 font-medium text-2xl text-foreground leading-tight">
                    Términos y políticas de compra
                  </Modal.Heading>
                </Modal.Header>

                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning focus-visible:outline-offset-2"
                  aria-label="Cerrar"
                >
                  <X aria-hidden="true" size={18} />
                </button>

                <Modal.Body className="overflow-y-auto p-6 text-muted text-sm leading-7 sm:p-7">
                  {isPublicConfigLoading && !website ? (
                    <LegalContentSkeleton />
                  ) : (
                    <div className="divide-y divide-border">
                      {legalSections.map((section) => (
                        <section
                          key={section.documentKey}
                          className="py-6 first:pt-0 last:pb-0"
                        >
                          <h3 className="font-medium text-foreground text-lg">
                            {section.title}
                          </h3>
                          {section.documents.length > 0 ? (
                            <BacanoRichText
                              documents={section.documents}
                              className="mt-4 grid gap-4 text-muted text-sm leading-7"
                            />
                          ) : (
                            <div className="mt-4">
                              <p>
                                Este documento no está disponible en este
                                momento.
                              </p>
                              <Link
                                href={section.href}
                                className="mt-2 inline-flex font-medium text-accent underline underline-offset-4"
                              >
                                Abrir la página completa
                              </Link>
                            </div>
                          )}
                        </section>
                      ))}

                      {advertisingStatement ? (
                        <section className="py-6 last:pb-0">
                          <h3 className="font-medium text-foreground text-lg">
                            Comunicaciones comerciales
                          </h3>
                          <p className="mt-4">{advertisingStatement}</p>
                        </section>
                      ) : null}
                    </div>
                  )}
                </Modal.Body>

                <Modal.Footer className="border-border border-t p-4 sm:px-7 sm:py-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-primary w-full"
                  >
                    Entendido
                  </button>
                </Modal.Footer>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

type LegalModalSection = {
  documentKey: LegalDocumentKey;
  href: string;
  title: string;
};

const LEGAL_MODAL_SECTIONS: LegalModalSection[] = [
  {
    documentKey: "terms",
    href: "/terminos-y-condiciones",
    title: "Términos y condiciones",
  },
  {
    documentKey: "privacy",
    href: "/privacidad",
    title: "Privacidad y tratamiento de datos",
  },
  {
    documentKey: "shipping",
    href: "/politicas-envio",
    title: "Políticas de envío",
  },
  {
    documentKey: "returns",
    href: "/cambios-y-devoluciones",
    title: "Cambios y devoluciones",
  },
];

function LegalDocumentButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="font-medium text-accent underline-offset-3 transition hover:text-accent hover:underline"
    >
      {children}
    </button>
  );
}

function LegalContentSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      <div className="h-4 w-full animate-pulse rounded-full bg-surface-secondary" />
      <div className="h-4 w-[92%] animate-pulse rounded-full bg-surface-secondary" />
      <div className="h-4 w-[78%] animate-pulse rounded-full bg-surface-secondary" />
      <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-surface-secondary" />
      <div className="h-4 w-[84%] animate-pulse rounded-full bg-surface-secondary" />
    </div>
  );
}

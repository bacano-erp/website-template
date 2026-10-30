"use client";

import { getWebsitePublicConfig, type WebsitePublicConfig } from "@bacano/sdk";
import {
  BacanoMarketingProvider,
  BacanoProvider,
  useBacanoState,
  useMarketing,
} from "@bacano/sdk/react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { clerkAppearance, clerkLocalization } from "@/config/clerk";
import { PostAuthProfileSync } from "@/features/account/PostAuthProfileSync";
import {
  canLoadClerkAtOrigin,
  publicConfigsMatch,
  requiresClerkRuntime,
  toBacanoInitialContext,
} from "@/features/account/runtime";
import {
  expectBacanoProviderClient,
  getBacanoAccessToken,
  setBacanoAccessTokenProvider,
  setBacanoProviderClient,
  setBacanoProviderClientError,
} from "@/lib/bacano/browser-client";
import { getBacanoEnv } from "@/lib/bacano/env";

type BuyerAccountsState = {
  loading: boolean;
  enabled: boolean;
  error: string | null;
  website: WebsitePublicConfig | null;
};

const BuyerAccountsContext = createContext<BuyerAccountsState>({
  loading: true,
  enabled: false,
  error: null,
  website: null,
});

type BuyerAccountsProviderProps = {
  children: ReactNode;
  initialPublicConfig?: WebsitePublicConfig | null;
};

export function BuyerAccountsProvider({
  children,
  initialPublicConfig = null,
}: BuyerAccountsProviderProps) {
  useState(() => {
    expectBacanoProviderClient();
    return true;
  });
  const pathname = usePathname();
  const isPreview = isPreviewPath(pathname);
  const needsClerk = requiresClerkRuntime(pathname);
  const browserOrigin = useSyncExternalStore(
    subscribeToBrowserOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );
  const [state, setState] = useState<BuyerAccountsState>({
    loading: initialPublicConfig === null,
    enabled: Boolean(
      initialPublicConfig?.buyerAccountsEnabled &&
        initialPublicConfig.clerkPublishableKey,
    ),
    error: null,
    website: initialPublicConfig,
  });

  useEffect(() => {
    let isMounted = true;
    const { apiUrl, websiteSlug } = getBacanoEnv();

    getWebsitePublicConfig({
      apiUrl,
      websiteSlug,
    })
      .then((website) => {
        if (!isMounted) return;
        setState((current) =>
          publicConfigsMatch(current.website, website) && !current.loading
            ? current
            : {
                loading: false,
                enabled: Boolean(
                  website.buyerAccountsEnabled && website.clerkPublishableKey,
                ),
                error: null,
                website,
              },
        );
      })
      .catch((error) => {
        if (!isMounted) return;

        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "No pudimos cargar la configuracion de cuenta.",
        }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const configuredClerkKey = state.enabled
    ? state.website?.clerkPublishableKey
    : null;
  const isCheckingClerkOrigin = Boolean(
    needsClerk && configuredClerkKey && browserOrigin === null,
  );
  const isClerkOriginAllowed = Boolean(
    configuredClerkKey &&
      browserOrigin &&
      canLoadClerkAtOrigin({
        publishableKey: configuredClerkKey,
        websiteDomain: state.website?.domain,
        origin: browserOrigin,
      }),
  );
  const contextValue = useMemo<BuyerAccountsState>(() => {
    if (!needsClerk || !configuredClerkKey) return state;

    if (isCheckingClerkOrigin) {
      return { ...state, loading: true, enabled: false };
    }

    if (!isClerkOriginAllowed) {
      return { ...state, loading: false, enabled: false, error: null };
    }

    return state;
  }, [
    configuredClerkKey,
    isCheckingClerkOrigin,
    isClerkOriginAllowed,
    needsClerk,
    state,
  ]);
  const marketingPublicConfig = isPreview ? null : state.website;
  const bacanoConfig = useMemo(() => {
    const { apiUrl, websiteSlug } = getBacanoEnv();

    return {
      apiUrl,
      websiteSlug,
      getAccessToken: getBacanoAccessToken,
      initialContext: toBacanoInitialContext(state.website),
      measurementAllowed: !isPreview,
    };
  }, [isPreview, state.website]);

  const clerkPublishableKey = isClerkOriginAllowed ? configuredClerkKey : null;

  return (
    <BacanoMarketingProvider
      publicConfig={marketingPublicConfig}
      scriptLoadStrategy="idle"
      measurementAllowed={!isPreview}
    >
      <BacanoProvider config={bacanoConfig}>
        <BacanoClientBridge />
        <BuyerAccountsContext.Provider value={contextValue}>
          <MarketingPageViews>
            {clerkPublishableKey && needsClerk ? (
              <ClerkProvider
                publishableKey={clerkPublishableKey}
                localization={clerkLocalization}
                appearance={clerkAppearance}
              >
                <ClerkAccessTokenBridge />
                {children}
              </ClerkProvider>
            ) : (
              children
            )}
          </MarketingPageViews>
        </BuyerAccountsContext.Provider>
      </BacanoProvider>
    </BacanoMarketingProvider>
  );
}

function BacanoClientBridge() {
  const { client, error } = useBacanoState();

  useEffect(() => {
    if (client) {
      setBacanoProviderClient(client);
    } else if (error) {
      setBacanoProviderClientError(error);
    }
  }, [client, error]);

  return null;
}

export function useBuyerAccounts() {
  return useContext(BuyerAccountsContext);
}

function ClerkAccessTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setBacanoAccessTokenProvider(() => getToken());

    return () => {
      setBacanoAccessTokenProvider(null);
    };
  }, [getToken]);

  return <PostAuthProfileSync />;
}

function MarketingPageViews({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const marketing = useMarketing();
  const isPreview = isPreviewPath(pathname);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (isPreview || !marketing.enabled) return;
    if (lastTrackedPath.current === pathname) return;

    lastTrackedPath.current = pathname;

    marketing.track({
      eventName: "page_view",
      pageTitle: document.title,
    });
  }, [isPreview, marketing, pathname]);

  return children;
}

function isPreviewPath(pathname: string) {
  return pathname === "/vista-previa" || pathname.startsWith("/vista-previa/");
}

function subscribeToBrowserOrigin() {
  return () => undefined;
}

function getBrowserOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return null;
}

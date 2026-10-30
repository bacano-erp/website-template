"use client";

import { type BacanoClient, createBacanoClient } from "@bacano/sdk";

import { getBacanoEnv } from "./env";

type BacanoAccessTokenProvider = () => Promise<string | null> | string | null;

let clientPromise: Promise<BacanoClient> | null = null;
let accessTokenProvider: BacanoAccessTokenProvider | null = null;
let providerClient: BacanoClient | null = null;
let providerClientError: Error | null = null;
let providerClientExpected = false;
let resolveProviderClient: ((client: BacanoClient) => void) | null = null;
let rejectProviderClient: ((error: Error) => void) | null = null;
let providerClientPromise: Promise<BacanoClient> | null = null;

export function setBacanoAccessTokenProvider(
  provider: BacanoAccessTokenProvider | null,
) {
  accessTokenProvider = provider;
}

export function getBacanoAccessToken() {
  return accessTokenProvider?.() ?? null;
}

export function expectBacanoProviderClient() {
  providerClientExpected = true;
  ensureProviderClientPromise();
}

export function setBacanoProviderClient(client: BacanoClient) {
  providerClient = client;
  providerClientError = null;
  resolveProviderClient?.(client);
  resolveProviderClient = null;
  rejectProviderClient = null;
  providerClientPromise = Promise.resolve(client);
}

export function setBacanoProviderClientError(error: Error) {
  providerClientError = error;
  rejectProviderClient?.(error);
  resolveProviderClient = null;
  rejectProviderClient = null;
  providerClientPromise = null;
}

export function getBacanoBrowserClient() {
  if (providerClient) return Promise.resolve(providerClient);
  if (providerClientError) return Promise.reject(providerClientError);
  if (providerClientExpected) return ensureProviderClientPromise();

  if (!clientPromise) {
    const { apiUrl, websiteSlug } = getBacanoEnv();
    const client = createBacanoClient({
      apiUrl,
      websiteSlug,
      tokenStorage: "localStorage",
      getAccessToken: () => accessTokenProvider?.() ?? null,
    });

    clientPromise = client.init().then(() => client);
  }

  return clientPromise;
}

function ensureProviderClientPromise() {
  if (providerClientError) return Promise.reject(providerClientError);
  if (!providerClientPromise) {
    providerClientPromise = new Promise<BacanoClient>((resolve, reject) => {
      resolveProviderClient = resolve;
      rejectProviderClient = reject;
    });
  }

  return providerClientPromise;
}

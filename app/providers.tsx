"use client";

import { createContext, useContext } from "react";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";

import { createApiFetcher } from "../lib/api-client";

const ApiKeyContext = createContext("");

export function useApiKey() {
  return useContext(ApiKeyContext);
}

export default function Providers({
  children,
  apiKey,
}: {
  children: React.ReactNode;
  apiKey: string;
}) {
  return (
    <SessionProvider>
      <ApiKeyContext.Provider value={apiKey}>
        <SWRConfig
          value={{
            fetcher: createApiFetcher(apiKey),
            revalidateOnFocus: false,
          }}
        >
          {children}
        </SWRConfig>
      </ApiKeyContext.Provider>
    </SessionProvider>
  );
}

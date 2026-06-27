"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import type { ReactNode } from "react";

const HTTP_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

const WS_RPC = HTTP_RPC.replace(/^http/, "ws");

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        loginMethods: ["google", "apple", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#9945ff",
          walletChainType: "solana-only",
          logo: undefined,
        },
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc(HTTP_RPC),
              rpcSubscriptions: createSolanaRpcSubscriptions(WS_RPC),
            },
          },
        },
        externalWallets: {
          solana: { connectors: toSolanaWalletConnectors() },
        },
        embeddedWallets: {
          solana: { createOnLogin: "all-users" },
          showWalletUIs: true,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
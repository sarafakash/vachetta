"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useMemo } from "react";

export function useSolanaWallet() {
  const { authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet?.name === "Privy") ?? wallets[0],
    [wallets]
  );

  return {
    wallet,
    address: wallet?.address,
    ready: privyReady && authenticated && !!wallet,
  };
}

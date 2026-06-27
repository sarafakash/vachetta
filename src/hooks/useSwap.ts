"use client";

import { useSignTransaction } from "@privy-io/react-auth/solana";
import { useState, useCallback, useRef } from "react";
import { connection } from "@/lib/solana";
import { useSolanaWallet } from "./useSolanaWallet";
import {
  getQuote,
  buildSwapTransaction,
  toBaseUnits,
  type QuoteResponse,
} from "@/lib/jupiter";
import { SOL_MINT } from "@/lib/birdeye";

type SwapState = "idle" | "quoting" | "signing" | "sending" | "done" | "error";

type QuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
};

const SLIPPAGE_BPS = 500;
export function useSwap() {
  const { wallet, address, ready } = useSolanaWallet();
  const { signTransaction } = useSignTransaction();

  const [state, setState] = useState<SwapState>("idle");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const lastParams = useRef<QuoteParams | null>(null);

  const previewQuote = useCallback(
    async (opts: {
      side: "buy" | "sell";
      tokenMint: string;
      tokenDecimals: number;
      amount: number;
    }) => {
      setState("quoting");
      setError(null);
      try {
        const isBuy = opts.side === "buy";
        const inputMint = isBuy ? SOL_MINT : opts.tokenMint;
        const outputMint = isBuy ? opts.tokenMint : SOL_MINT;
        const decimals = isBuy ? 9 : opts.tokenDecimals;
        const params: QuoteParams = {
          inputMint,
          outputMint,
          amount: toBaseUnits(opts.amount, decimals),
        };
        lastParams.current = params;
        const q = await getQuote({ ...params, slippageBps: SLIPPAGE_BPS });
        setQuote(q);
        setState("idle");
        return q;
      } catch (e) {
        setError((e as Error).message);
        setState("error");
        return null;
      }
    },
    []
  );

  const executeSwap = useCallback(async () => {
    if (!ready || !wallet || !address || !lastParams.current) {
      setError("Wallet not ready");
      setState("error");
      return null;
    }
    try {
      setState("signing");
      const freshQuote = await getQuote({
        ...lastParams.current,
        slippageBps: SLIPPAGE_BPS,
      });
      setQuote(freshQuote);

      const tx = await buildSwapTransaction(freshQuote, address);

      const { signedTransaction } = await signTransaction({
        transaction: tx.serialize(),
        wallet,
      });

      setState("sending");
      const sig = await connection.sendRawTransaction(signedTransaction, {
        skipPreflight: true,
        maxRetries: 3,
      });
      const confirmed = await pollForConfirmation(sig);
      if (!confirmed) {
        throw new Error(
          `Confirmation timed out — the swap may still have landed. Signature: ${sig}`
        );
      }

      setSignature(sig);
      setState("done");
      return sig;
    } catch (e) {
      console.error("Swap failed (full):", e);
      setError((e as Error).message);
      setState("error");
      return null;
    }
  }, [ready, wallet, address, signTransaction]);

  return { state, quote, error, signature, previewQuote, executeSwap };
}

async function pollForConfirmation(sig: string): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    const { value } = await connection.getSignatureStatus(sig, {
      searchTransactionHistory: true,
    });
    if (value?.err) {
      throw new Error("Transaction failed on-chain");
    }
    if (
      value?.confirmationStatus === "confirmed" ||
      value?.confirmationStatus === "finalized"
    ) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
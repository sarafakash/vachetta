import { VersionedTransaction } from "@solana/web3.js";

/**
 * Jupiter swap, free tier (no key): https://lite-api.jup.ag/swap/v1
 *   1. GET  /quote  -> route + amounts
 *   2. POST /swap   -> base64 VersionedTransaction built for the user's pubkey
 * Signing + sending is done by the caller (Privy embedded wallet + RPC),
 * see hooks/useSwap.ts. Move to https://api.jup.ag/swap/v1 with an API key
 * if/when you outgrow the free rate limit.
 */
const JUP_BASE = "https://lite-api.jup.ag/swap/v1";

export type QuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: { swapInfo: { label: string }; percent: number }[];
  // ...passed back to /swap verbatim
  [k: string]: unknown;
};

/** amount is in the input token's base units (lamports for SOL). */
export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  slippageBps?: number;
}): Promise<QuoteResponse> {
  const qs = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(params.amount),
    slippageBps: String(params.slippageBps ?? 100),
    onlyDirectRoutes: "true",
  });
  const res = await fetch(`${JUP_BASE}/quote?${qs}`);
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  return res.json();
}

/** Returns an unsigned VersionedTransaction ready for the user to sign. */
export async function buildSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<VersionedTransaction> {
  const res = await fetch(`${JUP_BASE}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true, // let Jupiter auto-tune slippage per trade
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: "high",
          maxLamports: 1_000_000,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap build failed (${res.status})`);
  const { swapTransaction } = await res.json();
  const bytes = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(bytes);
}

/** UI helper: human amount -> base units string for a given decimals. */
export function toBaseUnits(amount: number, decimals: number): string {
  return BigInt(Math.round(amount * 10 ** decimals)).toString();
}
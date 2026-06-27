"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSwap } from "@/hooks/useSwap";
import type { TokenOverview } from "@/lib/birdeye";

export function TradePanel({ token }: { token: TokenOverview }) {
  const { authenticated, login } = usePrivy();
  const { state, quote, error, signature, previewQuote, executeSwap } = useSwap();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");

  const num = parseFloat(amount);
  const valid = !isNaN(num) && num > 0;

  const onPreview = () =>
    valid &&
    previewQuote({
      side,
      tokenMint: token.address,
      tokenDecimals: token.decimals,
      amount: num,
    });

  const busy = state === "quoting" || state === "signing" || state === "sending";
  const outAmount =
    quote && side === "buy"
      ? Number(quote.outAmount) / 10 ** token.decimals
      : quote
      ? Number(quote.outAmount) / 1e9
      : null;

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-panel2 p-1 text-sm font-medium">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-md py-1.5 capitalize transition-colors ${
              side === s
                ? s === "buy"
                  ? "bg-mint/15 text-mint"
                  : "bg-down/15 text-down"
                : "text-muted hover:text-soft"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-xs uppercase tracking-wider text-muted">
        {side === "buy" ? "Pay (SOL)" : `Sell (${token.symbol})`}
      </label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onBlur={onPreview}
        inputMode="decimal"
        placeholder="0.0"
        className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-mono tnum text-lg text-white outline-none focus:border-violet"
      />

      {quote && outAmount != null && (
        <div className="mt-3 flex justify-between font-mono tnum text-sm">
          <span className="text-muted">Receive ≈</span>
          <span className="text-white">
            {outAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
            {side === "buy" ? token.symbol : "SOL"}
          </span>
        </div>
      )}
      {quote && (
        <div className="mt-1 flex justify-between font-mono tnum text-xs text-muted">
          <span>Price impact</span>
          <span>{(Number(quote.priceImpactPct) * 100).toFixed(2)}%</span>
        </div>
      )}

      {!authenticated ? (
        <button
          onClick={login}
          className="mt-4 w-full rounded-lg bg-violet py-2.5 font-medium text-white hover:opacity-90"
        >
          Sign in to trade
        </button>
      ) : (
        <button
          onClick={quote ? executeSwap : onPreview}
          disabled={!valid || busy}
          className={`mt-4 w-full rounded-lg py-2.5 font-medium text-white disabled:opacity-40 ${
            side === "buy" ? "bg-mint/90 text-ink" : "bg-down/90"
          }`}
        >
          {state === "quoting"
            ? "Getting price…"
            : state === "signing"
            ? "Confirm in wallet…"
            : state === "sending"
            ? "Submitting…"
            : quote
            ? `${side === "buy" ? "Buy" : "Sell"} ${token.symbol}`
            : "Get quote"}
        </button>
      )}

      {state === "done" && signature && (
        <a
          href={`https://solscan.io/tx/${signature}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-center font-mono text-xs text-mint hover:underline"
        >
          Filled ✓ view on Solscan
        </a>
      )}
      {error && <p className="mt-3 text-center text-xs text-down">{error}</p>}
    </div>
  );
}

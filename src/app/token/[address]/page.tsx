"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PriceChart } from "@/components/PriceChart";
import { TradePanel } from "@/components/TradePanel";
import { TokenLogo } from "@/components/TokenLogo";
import {
  getTokenOverview,
  getRecentTrades,
  type TokenOverview,
  type Trade,
} from "@/lib/birdeye";
import { shortAddr } from "@/lib/solana";

export default function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [token, setToken] = useState<TokenOverview | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoaded, setTradesLoaded] = useState(false);

  useEffect(() => {
    getTokenOverview(address).then(setToken).catch(() => {});
  }, [address]);

  useEffect(() => {
    setTradesLoaded(false);
    const load = () =>
      getRecentTrades(address, 30)
        .then(setTrades)
        .catch(() => {})
        .finally(() => setTradesLoaded(true));
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [address]);

  const up = (token?.priceChange24hPercent ?? 0) >= 0;

  return (
    <>
      <div className=" z-50 w-full bg-[#040406]/40 backdrop-blur-md border-b border-white/[0.04]">
        <Header />
      </div>

      {/* pt-8 creates the space beneath the sticky header so nothing is shoved up */}
      <main className="mx-auto max-w-5xl px-4 pt-28 pb-8">

        {/* Navigation is now part of the content flow */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted hover:text-white transition-colors group">
            <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <TokenLogo src={token?.logoURI} symbol={token?.symbol ?? "?"} size={40} />
          <div>
            <h1 className="text-xl font-semibold text-white">
              {token?.symbol ?? "…"}{" "}
              <span className="text-sm font-normal text-muted">{token?.name}</span>
            </h1>
            <div className="flex items-baseline gap-2 font-mono tnum">
              <span className="text-lg text-white">
                {token ? `$${token.price.toPrecision(4)}` : "—"}
              </span>
              {token && (
                <span className={up ? "text-emerald-400" : "text-rose-500"}>
                  {up ? "+" : ""}
                  {(token.priceChange24hPercent ?? 0).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
          <div className="space-y-5">
            <div className="glass-panel p-3">
              <PriceChart address={address} />
            </div>

            {token && (
              <div className="grid grid-cols-3 gap-3 font-mono tnum text-sm">
                <Stat label="Liquidity" value={token.liquidity} />
                <Stat label="24h Vol" value={token.v24hUSD} />
                <Stat label="Holders" value={token.holder} usd={false} />
              </div>
            )}

            <div className="glass-panel overflow-hidden">
              <div className="border-b border-white/[0.05] px-4 py-2.5 text-xs uppercase tracking-wider text-muted">
                Live trades
              </div>
              <div className="max-h-80 divide-y divide-white/[0.05] overflow-auto custom-scrollbar">
                {trades.map((t, i) => (
                  <div
                    key={`${t.txHash}-${i}`}
                    className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2 px-4 py-2 font-mono tnum text-xs"
                  >
                    <span className={t.side === "buy" ? "text-emerald-400" : "text-rose-500"}>
                      {t.side}
                    </span>
                    <span className="text-white/70">
                      ${(t.volumeUSD ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-right text-muted">
                      {shortAddr(t.owner, 3)}
                    </span>
                  </div>
                ))}
                {trades.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-muted">
                    {tradesLoaded ? "No recent trades for this token" : "Loading trades…"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>{token && <TradePanel token={token} />}</div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </>
  );
}

function Stat({ label, value, usd = true }: { label: string; value?: number; usd?: boolean }) {
  return (
    <div className="glass-panel px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 text-white">
        {value == null ? "—" : `${usd ? "$" : ""}${Intl.NumberFormat(undefined, { notation: "compact" }).format(value)}`}
      </div>
    </div>
  );
}
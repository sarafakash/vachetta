"use client";

import { useEffect, useState, useCallback } from "react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { getNetWorth, type NetWorth } from "@/lib/portfolio";

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtAmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 4 });

function Logo({ src, symbol }: { src?: string; symbol: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken)
    return <img src={src} alt="" onError={() => setBroken(true)} className="h-7 w-7 rounded-full bg-panel2 shrink-0 object-cover" />;
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel2 text-[10px] font-semibold text-soft">{(symbol || "?").slice(0, 3).toUpperCase()}</span>;
}

export function NetWorthCard() {
  const { address, ready } = useSolanaWallet();
  const [data, setData] = useState<NetWorth | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!address) return;
    setLoading(true);
    setErr(null);
    getNetWorth(address).then(setData).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [address]);

  useEffect(() => { load(); }, [load]);

  if (!ready) return null;

  return (
    <div className="glass-panel p-5 min-w-0 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">Net worth</span>
        <button onClick={load} disabled={loading} className="text-xs text-soft hover:text-white disabled:opacity-40" title="Refresh">
          {loading ? "…" : "↻"}
        </button>
      </div>
      <div className="mt-1 font-mono tnum text-3xl text-white truncate">
        {data ? fmtUsd(data.totalUsd) : loading ? "—" : "$0.00"}
      </div>
      <div className="mt-4 space-y-2 min-w-0">
        {loading && !data ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded bg-panel2/40" />) : data && data.holdings.length > 0 ? (
          data.holdings.map((h) => (
            <div key={h.mint} className="flex items-center gap-3 min-w-0">
              <Logo src={h.logoURI} symbol={h.symbol} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="truncate font-medium text-white">{h.symbol}</span>
                  <span className="font-mono tnum text-sm text-white truncate">{fmtUsd(h.valueUsd)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span className="font-mono tnum truncate">{fmtAmt(h.uiAmount)}</span>
                  <span className="font-mono tnum">{((data.totalUsd > 0 ? (h.valueUsd / data.totalUsd) * 100 : 0)).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))
        ) : <p className="text-xs text-muted">No holdings yet.</p>}
      </div>
    </div>
  );
}
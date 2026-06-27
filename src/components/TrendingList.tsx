"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTrending, searchTokens, type TrendingToken } from "@/lib/birdeye";
import { TokenLogo } from "@/components/TokenLogo";

const fmtUsd = (n?: number) => n == null ? "—" : n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toPrecision(3)}`;
const fmtCompact = (n?: number) => n == null ? "—" : Intl.NumberFormat(undefined, { notation: "compact" }).format(n);

const gridCols = "grid grid-cols-[3rem_minmax(0,1fr)_6rem_5rem_4rem] gap-3";

export function TrendingList() {
  const [tokens, setTokens] = useState<TrendingToken[] | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrendingToken[] | null>(null);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);

  useEffect(() => { getTrending(20).then(setTokens).catch(console.error); }, []);
  useEffect(() => {
    const kw = query.trim();
    if (kw.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++reqId.current;
    const t = setTimeout(() => {
      searchTokens(kw)
        .then((rows) => { if (id === reqId.current) setResults(rows); })
        .catch(() => { if (id === reqId.current) setResults([]); })
        .finally(() => { if (id === reqId.current) setSearching(false); });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const isSearching = query.trim().length >= 2;
  const rows = isSearching ? results : tokens;

  return (
    <div className="flex flex-col h-[520px] rounded-[20px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden min-w-0 max-w-full shadow-2xl">
      {}
      <div className="shrink-0 border-b border-white/[0.05] p-3">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none">
            <svg height="15" width="15" aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any token by name or symbol…"
            className="w-full h-10 pl-10 pr-9 rounded-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 text-sm text-white placeholder:text-[#86868b] outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white text-sm transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {}
      <div className={`${gridCols} px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#86868b] border-b border-white/[0.05] shrink-0`}>
        <span>#</span>
        <span>{isSearching ? "Results" : "Token"}</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">Vol</span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isSearching && searching && !results ? (
          <div className="py-16 text-center text-xs font-mono uppercase tracking-widest text-[#86868b] animate-pulse">
            Searching…
          </div>
        ) : isSearching && results && results.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#86868b]">
            No tokens found for “{query.trim()}”.
          </div>
        ) : (
          rows?.map((t, i) => {
            const up = (t.price24hChangePercent ?? 0) >= 0;
            return (
              <Link key={t.address} href={`/token/${t.address}`} className={`${gridCols} items-center px-6 py-3 hover:bg-white/[0.05] transition-colors border-b border-white/[0.02]`}>
                <span className="font-mono text-xs text-[#86868b]">{i + 1}</span>
                <span className="flex items-center gap-3 min-w-0">
                  <TokenLogo src={t.logoURI} symbol={t.symbol} size={24} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-semibold text-sm text-white">{t.symbol}</span>
                    <span className="truncate text-[10px] text-[#86868b]">{t.name}</span>
                  </div>
                </span>
                <span className="text-right font-mono text-sm text-white truncate">{fmtUsd(t.price)}</span>
                <span className={`text-right font-mono text-sm font-medium ${up ? "text-emerald-400" : "text-rose-500"}`}>{(t.price24hChangePercent ?? 0).toFixed(1)}%</span>
                <span className="text-right font-mono text-sm text-[#86868b] truncate">{fmtCompact(t.volume24hUSD)}</span>
              </Link>
            );
          })
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
}
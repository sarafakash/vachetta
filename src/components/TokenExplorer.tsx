"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getTrending,
  searchTokens,
  type TrendingToken,
} from "@/lib/birdeye";

const fmtUsd = (n?: number) =>
  n == null
    ? "—"
    : n >= 1
    ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : `$${n.toPrecision(3)}`;

function TokenLogo({ src, symbol, size = 52 }: { src?: string; symbol: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img 
        src={src} 
        alt="" 
        onError={() => setBroken(true)} 
        style={{ width: size, height: size }} 
        className="rounded-2xl bg-[#1c1c1e] shrink-0 object-cover border border-white/[0.08] shadow-sm" 
      />
    );
  }
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-2xl bg-[#1c1c1e] text-xs font-bold text-white uppercase border border-white/[0.08] tracking-widest">
      {symbol.slice(0, 2)}
    </span>
  );
}

export function TokenExplorer() {
  const [query, setQuery] = useState("");
  const [trending, setTrending] = useState<TrendingToken[] | null>(null);
  const [results, setResults] = useState<TrendingToken[] | null>(null);
  const [searching, setSearching] = useState(false);
  
  const reqId = useRef(0);

  useEffect(() => {
    getTrending(20).then(setTrending).catch(console.error);
  }, []);

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
        .then((rows) => {
          if (id === reqId.current) setResults(rows);
        })
        .catch(() => {
          if (id === reqId.current) setResults([]);
        })
        .finally(() => {
          if (id === reqId.current) setSearching(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const isSearching = query.trim().length >= 2;

  return (
    <div className="w-full text-white font-sans antialiased space-y-8 py-4">
      
      {}
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-8 select-none">
        <div className="flex items-center gap-3 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#f5f5f7]">
            {isSearching ? "Search Results" : "Trending Pairs"}
          </h3>
          {!isSearching && (
            <span className="text-[9px] uppercase tracking-widest bg-violet/10 text-violet px-2.5 py-0.5 font-extrabold rounded-full border border-violet/20">
              Live Feed
            </span>
          )}
        </div>

        {}
        <div className="relative flex-1 max-w-[460px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none">
            <svg 
              role="img" 
              height="16" 
              width="16" 
              aria-hidden="true" 
              viewBox="0 0 16 16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens by name or address..."
            className="w-full h-11 pl-12 pr-10 rounded-full bg-[#161617] border border-white/[0.06] focus:border-white/20 text-[14px] font-normal text-white placeholder:text-[#86868b] outline-none transition-all duration-200"
          />
          
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white text-sm p-1 font-semibold transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {}
      {!isSearching ? (
        <div className="relative overflow-hidden w-full py-2">
          <div 
            className="w-full overflow-hidden relative"
            style={{ maskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)" }}
          >
            <div className="flex gap-5 w-max animate-appleMarquee hover:[animation-play-state:paused] px-16 will-change-transform">
              {trending ? (
                [...trending, ...trending].map((t, i) => {
                  const up = (t.price24hChangePercent ?? 0) >= 0;
                  return (
                    <Link
                      key={`marquee-${t.address || i}-${i}`}
                      href={`/token/${t.address}`}
                      className="w-[290px] h-[160px] shrink-0 rounded-[24px] border border-white/[0.07] bg-[#161617] p-6 flex flex-col justify-between shadow-2xl hover:border-white/20 hover:bg-[#1d1d1f] transition-all duration-300 ease-out group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 leading-tight space-y-1">
                          <span className="text-[10px] font-mono font-bold text-white/20 tracking-widest block">#{ (i % trending.length) + 1 }</span>
                          <h4 className="truncate font-bold text-lg text-[#f5f5f7] tracking-tight group-hover:text-violet transition-colors">
                            {t.symbol}
                          </h4>
                          <p className="truncate text-xs text-[#86868b] font-medium">{t.name}</p>
                        </div>
                        <TokenLogo src={t.logoURI} symbol={t.symbol} size={52} />
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-white/[0.04]">
                        <div className="leading-tight space-y-0.5">
                          <span className="block text-[9px] font-bold text-[#86868b] uppercase tracking-wider">Price</span>
                          <span className="font-mono text-sm font-bold text-[#f5f5f7]">{fmtUsd(t.price)}</span>
                        </div>
                        <div className="text-right leading-tight space-y-0.5">
                          <span className="block text-[9px] font-bold text-[#86868b] uppercase tracking-wider">24h Change</span>
                          <span className={`font-mono text-xs font-bold ${up ? "text-emerald-400" : "text-rose-500"}`}>
                            {up ? "▲" : "▼"} {(t.price24hChangePercent ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[290px] h-[160px] shrink-0 rounded-[24px] border border-white/[0.06] bg-[#161617]/60 animate-pulse" />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 animate-slideUp">
          {searching && !results ? (
            <div className="py-20 text-center text-xs font-mono tracking-widest text-[#86868b] animate-pulse">
              LOADING CRYPTO INDICES...
            </div>
          ) : results && results.length === 0 ? (
            <div className="py-20 text-center text-sm text-[#86868b]">
              No crystal clear asset matches located.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {results?.map((t, i) => {
                const up = (t.price24hChangePercent ?? 0) >= 0;
                return (
                  <Link
                    key={`search-${t.address || i}`}
                    href={`/token/${t.address}`}
                    className="rounded-[24px] border border-white/[0.07] bg-[#161617] p-6 flex flex-col justify-between h-[160px] shadow-xl hover:border-white/20 hover:bg-[#1d1d1f] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 leading-tight space-y-0.5">
                        <h4 className="truncate font-bold text-lg text-[#f5f5f7] tracking-tight">{t.symbol}</h4>
                        <p className="truncate text-xs text-[#86868b] font-medium mt-0.5">{t.name}</p>
                      </div>
                      <TokenLogo src={t.logoURI} symbol={t.symbol} size={48} />
                    </div>

                    <div className="flex items-end justify-between pt-3 border-t border-white/[0.04]">
                      <div className="leading-tight space-y-0.5">
                        <span className="block text-[9px] font-bold text-[#86868b] uppercase tracking-wider">Price</span>
                        <span className="font-mono text-sm font-bold text-[#f5f5f7]">{fmtUsd(t.price)}</span>
                      </div>
                      <div className="text-right leading-tight space-y-0.5">
                        <span className="block text-[9px] font-bold text-[#86868b] uppercase tracking-wider">24h Change</span>
                        <span className={`font-mono text-xs font-bold ${up ? "text-emerald-400" : "text-rose-500"}`}>
                          {up ? "▲" : "▼"} {(t.price24hChangePercent ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes appleMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(calc(-50% - 10px), 0, 0); }
        }
        .animate-appleMarquee {
          animation: appleMarquee 38s linear infinite;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.2s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}</style>
    </div>
  );
}
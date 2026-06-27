"use client";

import { useEffect, useState } from "react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { getActivity, type ActivityItem } from "@/lib/portfolio";

const relTime = (unix: number) => {
  if (!unix) return "";
  const s = Math.floor(Date.now() / 1000 - unix);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const KIND_STYLE: Record<ActivityItem["kind"], { text: string }> = {
  buy: { text: "text-emerald-400" },
  sell: { text: "text-rose-500" },
  deposit: { text: "text-white" },
  send: { text: "text-white" },
  tx: { text: "text-white" },
};

function RowIcon({ src, label }: { src?: string; label: string }) {
  const [broken, setBroken] = useState(false);
  const symbol = label.split(" ")[1] ?? "";
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setBroken(true)}
        className="h-6 w-6 rounded-full bg-white/[0.06] object-cover"
      />
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold uppercase text-white/70">
      {symbol.slice(0, 2)}
    </span>
  );
}

function KindIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const map = {
    deposit: { glyph: "↓", cls: "bg-violet-400/15 text-violet-300" },
    send: { glyph: "↑", cls: "bg-white/[0.06] text-white/70" },
    tx: { glyph: "•", cls: "bg-white/[0.06] text-white/50" },
  } as const;
  const { glyph, cls } = map[kind as "deposit" | "send" | "tx"] ?? map.tx;
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${cls}`}
    >
      {glyph}
    </span>
  );
}

function ActivityIcon({ it }: { it: ActivityItem }) {
  const hasToken = it.kind === "buy" || it.kind === "sell";
  return (
    <span className="relative shrink-0">
      {hasToken ? (
        <RowIcon src={it.logoURI} label={it.label} />
      ) : (
        <KindIcon kind={it.kind} />
      )}
      {!it.success && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold leading-none text-white ring-2 ring-black/70 mx-2 my-2">
          ✕
        </span>
      )}
    </span>
  );
}

export function ActivityFeed() {
  const { address, ready } = useSolanaWallet();
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setItems(null);
      return;
    }
    setItems(null);
    setErr(null);
    getActivity(address)
      .then(setItems)
      .catch((e) => setErr(e.message));
  }, [address]);

  if (!ready) return null;

  return (
    <div className="glass-panel overflow-hidden">
      {err ? (
        <div className="p-5 text-sm text-rose-500">Couldn&apos;t load activity. {err}</div>
      ) : items === null ? (
        <div className="divide-y divide-white/[0.05]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-5 text-sm text-muted">
          No activity yet. Your trades and deposits will show up here.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {items.map((it) => {
            const style = KIND_STYLE[it.kind];
            return (
              <a
                key={it.signature}
                href={`https://solscan.io/tx/${it.signature}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors"
              >
                <ActivityIcon it={it} />
                <span className={`font-medium ${style.text}`}>{it.label}</span>
                <span className="ml-auto font-mono tnum text-sm text-white/70">
                  {it.solDelta != null && Math.abs(it.solDelta) > 1e-9
                    ? `${it.solDelta > 0 ? "+" : ""}${it.solDelta.toFixed(4)} SOL`
                    : ""}
                </span>
                <span className="w-16 text-right text-xs text-white/40">
                  {relTime(it.time)}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
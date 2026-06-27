/**
 * Typed-ish wrappers around the BirdEye endpoints the app uses, all going
 * through our /api/birdeye proxy. Endpoint paths/params verified against
 * docs.birdeye.so (Standard/free tier).
 *
 * Casing gotcha: BirdEye returns camelCase for v1/v2 endpoints and snake_case
 * for v3+. token_trending / token_overview / txs/token are v1/v2 (camelCase);
 * v3/ohlcv is v3 (snake_case). Don't mix them up — wrong field names fail
 * silently (undefined), not loudly.
 *
 * Free-tier reality: rate limit is per-account across all endpoints and
 * metered in compute units, so cache where you can and don't poll tighter
 * than you need. OHLCV v3 caps at 5000 candles/request.
 */
type OhlcvV3Row = { unix_time: number; o: number; h: number; l: number; c: number; v: number };
type OhlcvV1Row = { unixTime: number; o: number; h: number; l: number; c: number; v: number };


export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function be<T>(path: string, qs: Record<string, string | number> = {}): Promise<T> {
  const params = new URLSearchParams(
    Object.entries(qs).map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`/api/birdeye/${path}${params ? `?${params}` : ""}`);
  if (!res.ok) throw new Error(`BirdEye ${path} -> ${res.status}`);
  const json = await res.json();
  if (json?.success === false) throw new Error(json?.message ?? "BirdEye error");
  return json.data as T;
}

export type TrendingToken = {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  price: number;
  price24hChangePercent?: number;
  volume24hUSD?: number;
  liquidity?: number;
  rank?: number;
};

export function getTrending(limit = 20) {
  return be<{ tokens: TrendingToken[] }>("defi/token_trending", {
    sort_by: "rank",
    sort_type: "asc",
    offset: 0,
    limit,
  }).then((d) => d.tokens);
}

export type TokenOverview = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24hPercent?: number;
  liquidity?: number;
  v24hUSD?: number;
  mc?: number;
  holder?: number;
};

export function getTokenOverview(address: string) {
  return be<TokenOverview>("defi/token_overview", { address });
}

// ---- OHLCV (v3 → snake_case, with v1 fallback) ----

export type Candle = {
  unix_time: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  v_usd?: number;
};

export async function getOhlcv(
  address: string,
  type = "15m",
  from?: number,
  to?: number
): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const time_from = from ?? now - 60 * 60 * 24 * 3;
  const time_to = to ?? now;
  const params = { address, type, time_from, time_to };

  try {
    const d = await be<{ items: OhlcvV3Row[] }>("defi/v3/ohlcv", params);
    if (d.items?.length) {
      return d.items.map((c) => ({
        unix_time: c.unix_time,
        o: c.o,
        h: c.h,
        l: c.l,
        c: c.c,
        v: c.v,
      }));
    }
  } catch (e) {
    console.warn("OHLCV v3 failed, falling back to v1:", e);
  }

  const d1 = await be<{ items: OhlcvV1Row[] }>("defi/ohlcv", params);
  return (d1.items ?? []).map((c) => ({
    unix_time: c.unixTime,
    o: c.o,
    h: c.h,
    l: c.l,
    c: c.c,
    v: c.v,
  }));
}

// ---- Trades (v1 → camelCase). No volumeUSD field exists; we compute it. ----

type RawTradeLeg = {
  symbol: string;
  uiAmount: number;
  price: number | null;
  nearestPrice: number | null;
};

type RawTrade = {
  txHash: string;
  side: "buy" | "sell";
  blockUnixTime: number;
  owner: string;
  base: RawTradeLeg; // priced side (SOL/USDC)
  quote: RawTradeLeg; // the token
  from: RawTradeLeg;
  to: RawTradeLeg;
};

export type Trade = {
  txHash: string;
  side: "buy" | "sell";
  blockUnixTime: number;
  owner: string;
  volumeUSD: number;
};

export async function getRecentTrades(address: string, limit = 30): Promise<Trade[]> {
  try {
    const d = await be<{ items: RawTrade[] }>("defi/txs/token", {
      address,
      tx_type: "swap",
      sort_type: "desc",
      offset: 0,
      limit: Math.min(limit, 50), // endpoint caps limit at 50
    });
    return (d.items ?? []).map((t) => {
      const px = t.base?.price ?? t.base?.nearestPrice ?? 0;
      return {
        txHash: t.txHash,
        side: t.side,
        blockUnixTime: t.blockUnixTime,
        owner: t.owner,
        volumeUSD: Math.abs(t.base?.uiAmount ?? 0) * px,
      };
    });
  } catch (e) {
    // Some tokens (dead/illiquid) make this endpoint 400. Don't let the live
    // feed throw on every poll — just show no trades.
    console.warn("Recent trades unavailable:", e);
    return [];
  }
}

/**
 * Full-text token search via BirdEye /defi/v3/search (v3 -> snake_case).
 * Lets users find ANY token, not just today's trending 20.
 *
 * The response is grouped: data.items[] where each entry is
 * { type: "token" | "market", result: [...] }. We take the "token" group
 * and map its snake_case rows onto our camelCase TrendingToken shape so the
 * same row renderer works for both trending and search.
 *
 * Search rows are messier than trending: logo_uri is often missing and
 * symbol can be an empty string, so the UI must fall back gracefully.
 */
type SearchTokenRow = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_uri?: string;
  verified?: boolean;
  price?: number;
  price_change_24h_percent?: number;
  volume_24h_usd?: number;
  liquidity?: number;
};

export function searchTokens(keyword: string, limit = 20) {
  const kw = keyword.trim();
  if (kw.length < 2) return Promise.resolve<TrendingToken[]>([]);
  return be<{ items: Array<{ type: string; result: SearchTokenRow[] }> }>(
    "defi/v3/search",
    {
      chain: "solana",
      keyword: kw,
      target: "token",
      search_by: "combination",
      search_mode: "fuzzy",
      sort_by: "volume_24h_usd",
      sort_type: "desc",
      offset: 0,
      limit,
    }
  ).then((d) => {
    const group = (d.items ?? []).find((it) => it.type === "token");
    const rows = group?.result ?? [];
    return rows.map(
      (r): TrendingToken => ({
        address: r.address,
        symbol: r.symbol || r.name || "—",
        name: r.name ?? "",
        logoURI: r.logo_uri,
        price: r.price ?? 0,
        price24hChangePercent: r.price_change_24h_percent,
        volume24hUSD: r.volume_24h_usd,
        liquidity: r.liquidity,
      })
    );
  });
}
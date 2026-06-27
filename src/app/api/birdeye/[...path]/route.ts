import { NextRequest, NextResponse } from "next/server";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

type Entry = { body: string; status: number; ts: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<{ body: string; status: number }>>();

function freshMs(path: string): number {
  if (path.includes("ohlcv")) return 60_000; // candles move slowly
  if (path.includes("txs")) return 15_000; // live trades
  return 30_000; // overview, search, trending, etc.
}

const STALE_MS = 5 * 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "BIRDEYE_API_KEY not set" }, { status: 500 });
  }

  const joined = path.join("/");
  const search = req.nextUrl.search;
  const url = `${BIRDEYE_BASE}/${joined}${search}`;
  const cacheKey = joined + search;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.status === 200 && now - cached.ts < freshMs(joined)) {
    return json(cached.body, 200, "fresh");
  }

  let p = inflight.get(cacheKey);
  if (!p) {
    p = fetchWithRetry(url, key).finally(() => inflight.delete(cacheKey));
    inflight.set(cacheKey, p);
  }
  const { body, status } = await p;


  if (status === 200) {
    cache.set(cacheKey, { body, status, ts: Date.now() });
    return json(body, 200, "live");
  }

  if (cached && cached.status === 200 && now - cached.ts < STALE_MS) {
    return json(cached.body, 200, "stale");
  }

  return json(body || JSON.stringify({ success: false }), status, "error");
}

async function fetchWithRetry(
  url: string,
  key: string
): Promise<{ body: string; status: number }> {
  const doFetch = () =>
    fetch(url, {
      headers: {
        "X-API-KEY": key,
        "x-chain": "solana",
        accept: "application/json",
      },
      cache: "no-store",
    });

  let res = await doFetch();

  // One retry on rate-limit, honoring Retry-After (capped) if present.
  if (res.status === 429) {
    const ra = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 2000) : 700;
    await sleep(waitMs);
    res = await doFetch();
  }

  const body = await res.text();
  return { body, status: res.status };
}

function json(body: string, status: number, cacheState: string) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "application/json",
      "x-cache": cacheState,
    },
  });
}
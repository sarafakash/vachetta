/**
 * Net worth + activity, computed from on-chain truth.
 *
 * Net worth: balances from the RPC (SOL + SPL token accounts), priced with
 * BirdEye's token_overview. We deliberately do NOT use BirdEye's wallet/
 * portfolio endpoints — those are gated to higher packages.
 *
 * Activity: read straight from the wallet's tx history via the RPC and
 * classified locally (buy/sell/deposit) from balance deltas. The chain is the
 * source of truth — no DB to keep in sync.
 *
 * Cost control: BirdEye's free tier meters compute units, and pricing every
 * holding on every dashboard mount burns through them fast. So token prices
 * are cached in-memory with a short TTL, and on a failed lookup we serve the
 * last known price (stale-while-error) so net worth keeps rendering even once
 * the CU limit is hit. Activity results are cached per-wallet for the same
 * reason (and to spare the RPC the repeated getParsedTransaction fan-out).
 */
import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { connection } from "@/lib/solana";
import { getTokenOverview, SOL_MINT, type TokenOverview } from "@/lib/birdeye";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
// Jupiter v6 aggregator — presence in a tx is a strong "this was a swap" signal.
const JUP_V6 = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

const shortMint = (m: string) => `${m.slice(0, 4)}…${m.slice(-4)}`;

const PRICE_TTL = 60_000; // token prices are fine to reuse for a minute
const ACTIVITY_TTL = 30_000;

const priceCache = new Map<string, { at: number; data: TokenOverview }>();
const activityCache = new Map<string, { at: number; data: ActivityItem[] }>();

export type Holding = {
  mint: string;
  symbol: string;
  logoURI?: string;
  uiAmount: number;
  priceUsd: number;
  valueUsd: number;
};

export type NetWorth = { totalUsd: number; holdings: Holding[] };

export async function getNetWorth(address: string): Promise<NetWorth> {
  const owner = new PublicKey(address);

  // Balances are cheap RPC calls — always fetch fresh so the total is current.
  const [lamports, tokenAccounts] = await Promise.all([
    connection.getBalance(owner),
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    }),
  ]);

  const solUi = lamports / 1e9;

  const tokenBalances = tokenAccounts.value
    .map((acc) => {
      const info = (acc.account.data as { parsed: { info: ParsedTokenInfo } })
        .parsed.info;
      return {
        mint: info.mint,
        uiAmount: info.tokenAmount?.uiAmount ?? 0,
      };
    })
    .filter((t) => t.uiAmount > 0);

  const priced = await Promise.all([
    priceHolding(SOL_MINT, solUi, "SOL"),
    ...tokenBalances.map((t) => priceHolding(t.mint, t.uiAmount)),
  ]);

  const holdings = priced
    .filter((h): h is Holding => h !== null && h.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const totalUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);
  return { totalUsd, holdings };
}

type ParsedTokenInfo = {
  mint: string;
  tokenAmount?: { uiAmount: number | null };
};

/** token_overview with a short in-memory cache; serves stale on failure. */
async function cachedOverview(mint: string): Promise<TokenOverview | null> {
  const hit = priceCache.get(mint);
  if (hit && Date.now() - hit.at < PRICE_TTL) return hit.data;
  try {
    const o = await getTokenOverview(mint);
    priceCache.set(mint, { at: Date.now(), data: o });
    return o;
  } catch {
    return hit?.data ?? null; // stale-while-error: better than blank
  }
}

async function priceHolding(
  mint: string,
  uiAmount: number,
  fallbackSymbol?: string
): Promise<Holding | null> {
  const o = await cachedOverview(mint);
  if (!o) {
    // keep SOL visible even if its price lookup is unavailable
    return fallbackSymbol
      ? { mint, symbol: fallbackSymbol, uiAmount, priceUsd: 0, valueUsd: 0 }
      : null;
  }
  const priceUsd = o.price ?? 0;
  return {
    mint,
    symbol: o.symbol || fallbackSymbol || mint.slice(0, 4),
    logoURI: o.logoURI,
    uiAmount,
    priceUsd,
    valueUsd: uiAmount * priceUsd,
  };
}

export type ActivityKind = "buy" | "sell" | "deposit" | "send" | "tx";

export type ActivityItem = {
    signature: string;
    time: number; // unix seconds (0 if unknown)
    kind: ActivityKind;
    label: string;
    solDelta?: number;
    success: boolean;
    mint?: string; // token that moved, for buy/sell rows
    logoURI?: string; // token icon for buy/sell rows
  };

export async function getActivity(
  address: string,
  limit = 8
): Promise<ActivityItem[]> {
  const hit = activityCache.get(address);
  if (hit && Date.now() - hit.at < ACTIVITY_TTL) return hit.data;

  const owner = new PublicKey(address);
  try {
    const sigs = await connection.getSignaturesForAddress(owner, { limit });

    const txs = await Promise.all(
      sigs.map((s) =>
        connection
          .getParsedTransaction(s.signature, {
            maxSupportedTransactionVersion: 0,
          })
          .catch(() => null)
      )
    );

    const items = sigs.map((s, i) =>
      classify(address, s.signature, s.blockTime ?? 0, !s.err, txs[i])
    );

    // Resolve mint -> symbol for buy/sell rows. Dedupe across the feed and
    // reuse the price cache, so a feed full of POPCAT trades is one lookup.
    const mints = [...new Set(items.map((it) => it.mint).filter(Boolean) as string[])];
    const metaByMint = new Map<string, { symbol?: string; logoURI?: string }>();
    await Promise.all(
      mints.map(async (m) => {
        const o = await cachedOverview(m);
        if (o) metaByMint.set(m, { symbol: o.symbol, logoURI: o.logoURI });
      })
    );

    const labeled = items.map((it) => {
      if ((it.kind === "buy" || it.kind === "sell") && it.mint) {
        const meta = metaByMint.get(it.mint);
        const sym = meta?.symbol ?? shortMint(it.mint);
        return {
          ...it,
          label: `${it.kind === "buy" ? "Buy" : "Sell"} ${sym}`,
          logoURI: meta?.logoURI,
        };
      }
      return it;
    });

    activityCache.set(address, { at: Date.now(), data: labeled });
    return labeled;
  } catch {
    return hit?.data ?? []; // stale-while-error
  }
}

function classify(
  address: string,
  signature: string,
  time: number,
  success: boolean,
  tx: ParsedTransactionWithMeta | null
): ActivityItem {
  const base = { signature, time, success };
  if (!tx?.meta) return { ...base, kind: "tx", label: "Transaction" };

  const keys = tx.transaction.message.accountKeys.map((k) =>
    k.pubkey.toString()
  );
  const idx = keys.indexOf(address);
  const pre = tx.meta.preBalances?.[idx] ?? 0;
  const post = tx.meta.postBalances?.[idx] ?? 0;
  const solDelta = (post - pre) / 1e9;

  const programIds = new Set<string>();
  for (const ix of tx.transaction.message.instructions) {
    if ("programId" in ix && ix.programId) {
      programIds.add(ix.programId.toString());
    }
  }
  const looksLikeSwap =
    programIds.has(JUP_V6) ||
    (tx.meta.logMessages?.some((l) => l.toLowerCase().includes("jupiter")) ??
      false);

  const tokenMoved = ownerTokenMoved(address, tx);

  if (looksLikeSwap || (tokenMoved && Math.abs(solDelta) > 1e-9)) {
    const side: ActivityKind = solDelta < 0 ? "buy" : "sell";
    return {
      ...base,
      kind: side,
      label: side === "buy" ? "Buy" : "Sell",
      solDelta,
      mint: tokenMoved?.mint,
    };
  }
  if (!tokenMoved && solDelta > 0)
    return { ...base, kind: "deposit", label: "Deposit", solDelta };
  if (!tokenMoved && solDelta < 0)
    return { ...base, kind: "send", label: "Sent SOL", solDelta };

  return { ...base, kind: "tx", label: "Transaction", solDelta };
}

/** Largest token-balance change for `address` in this tx, if any. */
function ownerTokenMoved(
  address: string,
  tx: ParsedTransactionWithMeta
): { mint: string; delta: number } | null {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const byMint = new Map<string, { pre: number; post: number }>();

  for (const b of pre) {
    if (b.owner === address)
      byMint.set(b.mint, { pre: b.uiTokenAmount.uiAmount ?? 0, post: 0 });
  }
  for (const b of post) {
    if (b.owner === address) {
      const e = byMint.get(b.mint) ?? { pre: 0, post: 0 };
      e.post = b.uiTokenAmount.uiAmount ?? 0;
      byMint.set(b.mint, e);
    }
  }

  let best: { mint: string; delta: number } | null = null;
  for (const [mint, e] of byMint) {
    const delta = e.post - e.pre;
    if (Math.abs(delta) > 0 && (!best || Math.abs(delta) > Math.abs(best.delta)))
      best = { mint, delta };
  }
  return best;
}
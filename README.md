# ChadWallet

A fomo.family-style Solana trading app. Sign in with Google/Apple, get an
embedded wallet, fund it, and trade trending tokens with real market data.

## Stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Auth + wallet  | **Privy** (embedded Solana wallet)      |
| Market data    | **BirdEye** (trending, OHLCV, trades)   |
| Swaps          | **Jupiter** lite-api (quote → swap)     |
| RPC            | **Alchemy** Solana                      |
| Charts         | **Lightweight Charts** (see note below) |
| DB / profiles  | **Supabase**                            |
| Host           | **Vercel**                              |

Every service here has a free tier.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

Keys to get (all free):

1. **Privy** — dashboard.privy.io → new app → enable Google, Apple, and Solana
   embedded wallets → copy App ID into `NEXT_PUBLIC_PRIVY_APP_ID`.
2. **Alchemy** — create a Solana app → paste the https RPC URL into
   `NEXT_PUBLIC_SOLANA_RPC`.
3. **BirdEye** — birdeye.so/data-api → Standard (free) plan → `BIRDEYE_API_KEY`
   (server-only; proxied through `/api/birdeye`).
4. **Supabase** — new project → URL + anon key. Run the SQL in
   `src/lib/supabase.ts` to create the tables.

## How it's wired (build order = risk order)

1. **Auth + embedded wallet** (`providers.tsx`, `useSolanaWallet`) — riskiest
   integration, done first. `authenticated` fires before the wallet is ready,
   so signing is gated on a separate `ready` flag.
2. **Read layer** (`lib/birdeye.ts`) — trending list and token detail populate
   from real data immediately.
3. **Deposit** (`WalletCard`) — address + QR; receiving SOL/USDC needs no swap
   logic.
4. **Trading** (`lib/jupiter.ts`, `useSwap`) — quote → build tx → Privy signs →
   send via RPC → confirm. Second-riskiest; the Privy `signTransaction` arg
   shape is the one line to double-check against the installed v3 types.
5. **Charts** (`PriceChart`) — Lightweight Charts fed by BirdEye OHLCV.
6. **Net worth + activity** — Supabase snapshots (stubbed in the dashboard).

## Note on TradingView

The brief links the TradingView **Charting Library** (Advanced Charts). That's
a gated private repo, and its license isn't granted for solo/test projects —
only companies on public products. So this MVP uses **Lightweight Charts**
(Apache-2.0, same vendor, powers TradingView's own stock simulator). The
Datafeed adapter is a clean drop-in swap once ChadWallet has org access.

import { createClient } from "@supabase/supabase-js";

/**
 * Profiles, networth snapshots, and an activity feed live here.
 * Suggested tables (run in Supabase SQL editor):
 *
 *   create table profiles (
 *     id text primary key,            -- privy user id
 *     wallet text,
 *     handle text,
 *     created_at timestamptz default now()
 *   );
 *
 *   create table networth_snapshots (
 *     id bigint generated always as identity primary key,
 *     wallet text not null,
 *     usd numeric not null,
 *     captured_at timestamptz default now()
 *   );
 *
 *   create table activity (
 *     id bigint generated always as identity primary key,
 *     wallet text not null,
 *     kind text not null,             -- 'buy' | 'sell' | 'deposit'
 *     token text,
 *     amount numeric,
 *     usd numeric,
 *     tx text,
 *     created_at timestamptz default now()
 *   );
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

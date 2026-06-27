import { Connection } from "@solana/web3.js";

/** Single shared RPC connection. Alchemy free tier via NEXT_PUBLIC_SOLANA_RPC. */
export const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

export function shortAddr(a?: string, n = 4): string {
  if (!a) return "";
  return `${a.slice(0, n)}…${a.slice(-n)}`;
}

"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PublicKey } from "@solana/web3.js";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { connection, shortAddr } from "@/lib/solana";

export function WalletCard() {
  const { address, ready } = useSolanaWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    connection
      .getBalance(new PublicKey(address))
      .then((lamports) => setSol(lamports / 1e9))
      .catch(() => setSol(null));
  }, [address]);

  if (!ready || !address) {
    return (
      <div className="glass-panel p-5 text-sm text-muted min-w-0 w-full">
        Connecting wallet…
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 min-w-0 w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted">Balance</div>
          <div className="mt-1 font-mono tnum text-2xl text-white truncate">
            {sol === null ? "—" : sol.toFixed(4)}{" "}
            <span className="text-sm text-soft">SOL</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="mt-3 font-mono text-xs text-soft hover:text-white transition-colors truncate block"
            title="Copy address"
          >
            {copied ? "copied ✓" : shortAddr(address, 6)}
          </button>
        </div>
        <div className="rounded-lg bg-white/10 p-2 shrink-0">
          <QRCodeSVG value={address} size={84} />
        </div>
      </div>
      <p className="mt-4 text-xs text-muted truncate">
        Send SOL or USDC to this address to fund your account.
      </p>
    </div>
  );
}
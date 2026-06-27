"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";

export function LoginButton() {
  const { login, authenticated, logout, user } = usePrivy();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-lg bg-violet px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Sign in
      </button>
    );
  }

  const email =
    user?.google?.email ?? user?.email?.address ?? "Account";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-soft hover:text-white hover:border-white/20 transition-colors"
      >
        <span className="h-2 w-2 rounded-full bg-mint" />
        <span className="max-w-[14rem] truncate">{email}</span>
        <span className={`text-xl transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-panel shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-muted">
              Signed in as
            </div>
            <div className="mt-0.5 truncate text-sm text-white">{email}</div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-down hover:bg-panel2 transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
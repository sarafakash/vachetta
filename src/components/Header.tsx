"use client";

import Link from "next/link";
import { LoginButton } from "./LoginButton";

export function Header() {
  return (
    <header className="fixed top-3 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
        
        {/* Minimal Logo Group */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* Restored Purple Accent Color with hover effect */}
          <div className="text-[#a855f7] transition-all duration-300 group-hover:text-white">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M4 6L13.5 25.5C14.5 27.5 17.5 27.5 18.5 25.5L28 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-medium text-[15px] text-white/90 tracking-tight transition-colors group-hover:text-white">
            Vachetta
          </span>
        </Link>

        <div>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
"use client";

import { useState } from "react";

export function TokenLogo({
  src,
  symbol,
  size = 40,
}: {
  src?: string;
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;

  if (!src || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-panel2 font-semibold text-soft"
        style={{ width: px, height: px, fontSize: size * 0.36 }}
      >
        {symbol?.replace(/^\$/, "").slice(0, 3).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-panel2 object-cover"
      style={{ width: px, height: px }}
    />
  );
}
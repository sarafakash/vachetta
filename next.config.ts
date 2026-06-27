import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  webpack: (config) => {
    // Privy lazily references Farcaster mini-app modules for an optional login
    // method we don't use. Alias them off so webpack doesn't try to resolve a
    // chain of optional peer deps. Safe because the code paths are never hit.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": false,
      "@farcaster/miniapp-sdk": false,
    };
    return config;
  },
};

export default nextConfig;

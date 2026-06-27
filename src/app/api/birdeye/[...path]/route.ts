import { NextRequest, NextResponse } from "next/server";
const BIRDEYE_BASE = "https://public-api.birdeye.so";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "BIRDEYE_API_KEY not set" },
      { status: 500 }
    );
  }

  const search = req.nextUrl.search;
  const url = `${BIRDEYE_BASE}/${path.join("/")}${search}`;

  async function hit() {
    return fetch(url, {
      headers: {
        "X-API-KEY": key as string,
        "x-chain": "solana",
        accept: "application/json",
      },
      next: { revalidate: 30 },
    });
  }

  let res = await hit();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 600));
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type UTCTimestamp,
} from "lightweight-charts";
import { getOhlcv } from "@/lib/birdeye";

type Status = "loading" | "ready" | "empty" | "error";

function precisionFor(minPrice: number): number {
  if (!isFinite(minPrice) || minPrice <= 0) return 6;
  if (minPrice >= 1) return 2;
  return Math.min(12, Math.ceil(-Math.log10(minPrice)) + 3);
}

export function PriceChart({ address, type = "15m" }: { address: string; type?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    setStatus("loading");

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9aa0ae",
        fontFamily: "var(--font-mono)",
      },
      localization: {
        priceFormatter: (p: number) => (p < 1 ? p.toPrecision(4) : p.toFixed(2)),
      },
      grid: {
        vertLines: { color: "#1a1d28" },
        horzLines: { color: "#1a1d28" },
      },
      rightPriceScale: { borderColor: "#252836" },
      timeScale: { borderColor: "#252836", timeVisible: true },
      width: el.clientWidth,
      height: 360,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#14f195",
      downColor: "#ff5470",
      borderVisible: false,
      wickUpColor: "#14f195",
      wickDownColor: "#ff5470",
    });
    series.priceScale().applyOptions({ scaleMargins: { top: 0.12, bottom: 0.12 } });

    let alive = true;
    getOhlcv(address, type)
      .then((candles) => {
        if (!alive) return;
        const data = candles
          .map((c) => {
            const low = c.l > 0 ? c.l : Math.min(c.o, c.c);
            const high = c.h > 0 ? c.h : Math.max(c.o, c.c);
            return {
              time: c.unix_time as UTCTimestamp,
              open: c.o,
              high,
              low,
              close: c.c,
            };
          })
          .filter((d) => d.close > 0)
          .sort((a, b) => (a.time as number) - (b.time as number));

        if (data.length === 0) {
          setStatus("empty");
          return;
        }
        const minP = Math.min(...data.map((d) => d.low).filter((v) => v > 0));
        const precision = precisionFor(minP);
        series.applyOptions({
          priceFormat: {
            type: "price",
            precision,
            minMove: Math.pow(10, -precision),
          },
        });

        series.setData(data);
        chart.timeScale().fitContent();
        setStatus("ready");
      })
      .catch((e) => {
        console.warn("OHLCV load failed:", e);
        if (alive) setStatus("error");
      });

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [address, type]);

  return (
    <div className="relative min-h-[360px] w-full">
      <div ref={ref} className="w-full" />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted">
          {status === "loading"
            ? "Loading chart…"
            : status === "empty"
            ? "No chart data for this token"
            : "Couldn't load chart — check console"}
        </div>
      )}
    </div>
  );
}
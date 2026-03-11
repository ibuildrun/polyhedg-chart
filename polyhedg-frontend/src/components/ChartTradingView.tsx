"use client";
/**
 * VARIANT 7: TradingView - CONTINUOUS SMOOTH ANIMATION
 * rAF loop ALWAYS runs, every frame updates the last point.
 * When new price arrives, target changes and line smoothly pulls toward it.
 * Never stops animating.
 */
import { useRef, useEffect } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, LineSeriesOptions, DeepPartial } from "lightweight-charts";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#3b82f6";

export default function ChartTradingView({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rafRef = useRef(0);
  const displayY = useRef(0);
  const targetY = useRef(0);
  const curSec = useRef(0);
  const ready = useRef(false);
  const pointsRef = useRef<PricePoint[]>([]);

  // keep a ref to points so rAF can read latest
  useEffect(() => { pointsRef.current = points; }, [points]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.3)",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(59,130,246,0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(59,130,246,0.3)", width: 1, style: 2 },
      },
      handleScroll: false,
      handleScale: false,
    });
    const opts: DeepPartial<LineSeriesOptions> = {
      color: LINE_COLOR, lineWidth: 2,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      priceLineVisible: false, lastValueVisible: false,
    };
    const series = chart.addSeries(LineSeries, opts);
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) chart.applyOptions({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(containerRef.current);

    // MAIN ANIMATION LOOP - never stops
    const tick = () => {
      const pts = pointsRef.current;
      const s = seriesRef.current;
      if (!s || pts.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      // Seed once
      if (!ready.current) {
        const seen = new Set<number>();
        const data: { time: number; value: number }[] = [];
        for (const p of pts) {
          const ts = Math.floor(p.t / 1000);
          if (!seen.has(ts)) { seen.add(ts); data.push({ time: ts, value: p.v }); }
        }
        data.sort((a, b) => a.time - b.time);
        if (data.length > 1) {
          s.setData(data as any);
          const last = data[data.length - 1]!;
          displayY.current = last.value;
          targetY.current = last.value;
          curSec.current = last.time;
          ready.current = true;
          chart.timeScale().scrollToRealTime();
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Get latest target from points
      const last = pts[pts.length - 1]!;
      const newSec = Math.floor(last.t / 1000);
      targetY.current = last.v;

      // New second arrived - commit current display value and move to new second
      if (newSec > curSec.current) {
        // Finalize old second with current display value
        s.update({ time: curSec.current as any, value: displayY.current });
        curSec.current = newSec;
      }

      // Lerp toward target - ALWAYS, every frame, never stop
      displayY.current += (targetY.current - displayY.current) * 0.04;

      // Push animated value to chart
      s.update({ time: curSec.current as any, value: displayY.current });
      chart.timeScale().scrollToRealTime();

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); chart.remove(); };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

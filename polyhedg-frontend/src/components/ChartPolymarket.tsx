"use client";
/**
 * VARIANT 10: Polymarket Clone - TradingView + Canvas Overlay
 * TradingView handles axes/scaling/crosshair (hidden line).
 * A canvas overlay on top draws the SMOOTH animated line via rAF lerp.
 * This is exactly how Polymarket does it - two canvas layers.
 */
import { useRef, useEffect } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, DeepPartial, LineSeriesOptions } from "lightweight-charts";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A"; // BTC orange like Polymarket
const LERP_FACTOR = 0.08;
const WINDOW_SEC = 120; // 2 min visible window

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rafRef = useRef(0);

  // Animated display values for each second
  const displayPts = useRef<Map<number, { display: number; target: number }>>(new Map());
  const latestSec = useRef(0);
  const pointsRef = useRef<PricePoint[]>([]);

  useEffect(() => { pointsRef.current = points; }, [points]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const container = wrapRef.current;

    // Create TradingView chart (invisible line - just for axes)
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.25)",
        fontFamily: "Inter, -apple-system, sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.04)", style: 1 },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 3,
      },
      crosshair: {
        vertLine: { color: "rgba(247,147,26,0.2)", width: 1, style: 2, labelVisible: false },
        horzLine: { color: "rgba(247,147,26,0.2)", width: 1, style: 2, labelVisible: true },
      },
      handleScroll: false,
      handleScale: false,
    });

    // Invisible series just to feed data for axis scaling
    const lineOpts: DeepPartial<LineSeriesOptions> = {
      color: "transparent",
      lineWidth: 0,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    };
    const series = chart.addSeries(LineSeries, lineOpts);
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        chart.applyOptions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    ro.observe(container);

    // MAIN ANIMATION LOOP
    let seeded = false;
    const tick = () => {
      const pts = pointsRef.current;
      const s = seriesRef.current;
      const overlay = overlayRef.current;
      if (!s || !overlay || !container || pts.length < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Seed TradingView with data for axis scaling
      if (!seeded) {
        const seen = new Set<number>();
        const tvData: { time: number; value: number }[] = [];
        for (const p of pts) {
          const sec = Math.floor(p.t / 1000);
          if (!seen.has(sec)) { seen.add(sec); tvData.push({ time: sec, value: p.v }); }
        }
        tvData.sort((a, b) => a.time - b.time);
        if (tvData.length > 1) {
          s.setData(tvData as any);
          for (const d of tvData) {
            displayPts.current.set(d.time, { display: d.value, target: d.value });
          }
          latestSec.current = tvData[tvData.length - 1]!.time;
          seeded = true;
          chart.timeScale().scrollToRealTime();
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Update targets from latest points
      const last = pts[pts.length - 1]!;
      const newSec = Math.floor(last.t / 1000);

      if (newSec > latestSec.current) {
        // Finalize old second
        const old = displayPts.current.get(latestSec.current);
        if (old) old.target = old.display;
        // New second
        latestSec.current = newSec;
        const prev = displayPts.current.get(newSec);
        if (prev) {
          prev.target = last.v;
        } else {
          // Start display from previous value for smooth transition
          const prevVal = old ? old.display : last.v;
          displayPts.current.set(newSec, { display: prevVal, target: last.v });
        }
        // Feed TradingView for axis scaling
        s.update({ time: newSec as any, value: last.v });
        chart.timeScale().scrollToRealTime();
      } else {
        const cur = displayPts.current.get(newSec);
        if (cur) cur.target = last.v;
      }

      // Prune old points (keep 5 min)
      const cutoff = newSec - 300;
      for (const [k] of displayPts.current) {
        if (k < cutoff) displayPts.current.delete(k);
      }

      // LERP all display values toward targets
      for (const [, entry] of displayPts.current) {
        entry.display += (entry.target - entry.display) * LERP_FACTOR;
      }

      // DRAW on canvas overlay
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (overlay.width !== cw || overlay.height !== ch) {
        overlay.width = cw;
        overlay.height = ch;
      }
      const ctx = overlay.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Get sorted display points
      const sorted = Array.from(displayPts.current.entries())
        .sort((a, b) => a[0] - b[0]);
      if (sorted.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      // Calculate Y range from display values
      let yMin = Infinity, yMax = -Infinity;
      for (const [, e] of sorted) {
        if (e.display < yMin) yMin = e.display;
        if (e.display > yMax) yMax = e.display;
      }
      const yPad = (yMax - yMin) * 0.12 || 5;
      yMin -= yPad;
      yMax += yPad;

      // X range: last WINDOW_SEC seconds
      const xMax = sorted[sorted.length - 1]![0];
      const xMin = xMax - WINDOW_SEC;

      // Padding for TV axes area
      const padR = 55; // right price scale
      const padB = 28; // bottom time scale
      const chartW = w - padR;
      const chartH = h - padB;

      const mapX = (sec: number) => ((sec - xMin) / (xMax - xMin)) * chartW;
      const mapY = (val: number) => chartH - ((val - yMin) / (yMax - yMin)) * chartH;

      // Filter visible points
      const visible = sorted.filter(([sec]) => sec >= xMin);
      if (visible.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      // Draw smooth curve with quadratic bezier
      ctx.beginPath();
      let fx = mapX(visible[0]![0]);
      let fy = mapY(visible[0]![1].display);
      ctx.moveTo(fx, fy);
      let lx = fx, ly = fy;

      for (let i = 1; i < visible.length; i++) {
        const x = mapX(visible[i]![0]);
        const y = mapY(visible[i]![1].display);
        const mx = (lx + x) / 2;
        const my = (ly + y) / 2;
        ctx.quadraticCurveTo(lx, ly, mx, my);
        lx = x;
        ly = y;
      }
      ctx.lineTo(lx, ly);

      // Stroke line
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Gradient fill under line
      const fillPath = new Path2D();
      fillPath.moveTo(fx, fy);
      lx = fx; ly = fy;
      for (let i = 1; i < visible.length; i++) {
        const x = mapX(visible[i]![0]);
        const y = mapY(visible[i]![1].display);
        const mx = (lx + x) / 2;
        const my = (ly + y) / 2;
        fillPath.quadraticCurveTo(lx, ly, mx, my);
        lx = x; ly = y;
      }
      fillPath.lineTo(lx, ly);
      fillPath.lineTo(lx, chartH);
      fillPath.lineTo(fx, chartH);
      fillPath.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, chartH);
      grad.addColorStop(0, "rgba(247, 147, 26, 0.15)");
      grad.addColorStop(1, "rgba(247, 147, 26, 0)");
      ctx.fillStyle = grad;
      ctx.fill(fillPath);

      // Pulsing dot at end
      const now = Date.now();
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.beginPath();
      ctx.arc(lx, ly, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(247, 147, 26, ${0.15 + pulse * 0.1})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = LINE_COLOR;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      chart.remove();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}
      />
    </div>
  );
}

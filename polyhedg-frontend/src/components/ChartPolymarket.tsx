"use client";
/**
 * VARIANT 10: Polymarket Clone - TIME-BASED interpolation
 * When new tick arrives: prevPrice=current display, nextPrice=new tick.
 * Between ticks: smoothly interpolate from prev to next over the tick interval.
 * No lerp jitter - pure time-based easing. Line never jumps.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A";
const RANGE_LERP = 0.02;
const WINDOW_MS = 90_000;

// Ease-in-out for smooth transitions
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Time-based interpolation state
  const prevPrice = useRef(0);
  const nextPrice = useRef(0);
  const transitionStart = useRef(0);
  const transitionDuration = useRef(300); // ms, adapts to actual tick interval
  const lastTickTime = useRef(0);
  const displayPrice = useRef(0);

  // Smooth Y range
  const rangeMin = useRef(0);
  const rangeMax = useRef(0);
  const rangeMinTarget = useRef(0);
  const rangeMaxTarget = useRef(0);
  const inited = useRef(false);

  // Snapshot of historical points (excluding the animated tip)
  const historyRef = useRef<PricePoint[]>([]);
  const pointsRef = useRef<PricePoint[]>([]);
  const lastPointsLen = useRef(0);

  useEffect(() => {
    pointsRef.current = points;

    // Detect new tick
    if (points.length > lastPointsLen.current && points.length >= 2) {
      const now = Date.now();
      const newVal = points[points.length - 1]!.v;

      if (lastTickTime.current > 0) {
        // Adapt duration to actual tick interval (clamped 100-1000ms)
        const interval = now - lastTickTime.current;
        transitionDuration.current = Math.max(100, Math.min(1000, interval));
      }

      // Previous display becomes start, new tick becomes target
      prevPrice.current = displayPrice.current || newVal;
      nextPrice.current = newVal;
      transitionStart.current = now;
      lastTickTime.current = now;

      // Store history (all points except the very last which we animate)
      historyRef.current = points.slice(0, -1);
    }
    lastPointsLen.current = points.length;
  }, [points]);

  useEffect(() => {
    const tick = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const pts = pointsRef.current;
      if (!canvas || !container || pts.length < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = Date.now();

      // Init
      if (!inited.current) {
        const last = pts[pts.length - 1]!;
        displayPrice.current = last.v;
        prevPrice.current = last.v;
        nextPrice.current = last.v;
        transitionStart.current = now;
        lastTickTime.current = now;
        historyRef.current = pts.slice(0, -1);

        let lo = Infinity, hi = -Infinity;
        for (const p of pts) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
        const pad = (hi - lo) * 0.15 || 10;
        rangeMin.current = rangeMinTarget.current = lo - pad;
        rangeMax.current = rangeMaxTarget.current = hi + pad;
        inited.current = true;
      }

      // Time-based interpolation: smooth from prev to next
      const elapsed = now - transitionStart.current;
      const progress = Math.min(1, elapsed / transitionDuration.current);
      const eased = easeInOut(progress);
      displayPrice.current = prevPrice.current + (nextPrice.current - prevPrice.current) * eased;

      // Visible history
      const tMin = now - WINDOW_MS;
      const visibleHistory = historyRef.current.filter(p => p.t >= tMin);

      // Calculate target Y range
      let lo = Infinity, hi = -Infinity;
      for (const p of visibleHistory) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
      if (displayPrice.current < lo) lo = displayPrice.current;
      if (displayPrice.current > hi) hi = displayPrice.current;
      if (lo === Infinity) { lo = displayPrice.current - 10; hi = displayPrice.current + 10; }
      const pad = (hi - lo) * 0.15 || 10;
      rangeMinTarget.current = lo - pad;
      rangeMaxTarget.current = hi + pad;

      // Lerp Y range
      rangeMin.current += (rangeMinTarget.current - rangeMin.current) * RANGE_LERP;
      rangeMax.current += (rangeMaxTarget.current - rangeMax.current) * RANGE_LERP;

      // Canvas
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw; canvas.height = ch;
      }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rMin = rangeMin.current;
      const rMax = rangeMax.current;
      const mapX = (t: number) => ((t - tMin) / (now - tMin)) * w;
      const mapY = (v: number) => h - ((v - rMin) / (rMax - rMin)) * h;

      // Build draw points: history + animated tip
      const drawPts: { x: number; y: number }[] = [];
      for (const p of visibleHistory) {
        drawPts.push({ x: mapX(p.t), y: mapY(p.v) });
      }
      // Animated tip at current time
      drawPts.push({ x: mapX(now), y: mapY(displayPrice.current) });

      if (drawPts.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      // Draw smooth quadratic bezier curve
      ctx.beginPath();
      const first = drawPts[0]!;
      ctx.moveTo(first.x, first.y);
      let lx = first.x, ly = first.y;

      for (let i = 1; i < drawPts.length; i++) {
        const pt = drawPts[i]!;
        const mx = (lx + pt.x) / 2;
        const my = (ly + pt.y) / 2;
        ctx.quadraticCurveTo(lx, ly, mx, my);
        lx = pt.x; ly = pt.y;
      }
      ctx.lineTo(lx, ly);

      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Gradient fill
      ctx.lineTo(lx, h);
      ctx.lineTo(first.x, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(247, 147, 26, 0.18)");
      grad.addColorStop(1, "rgba(247, 147, 26, 0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Pulsing dot
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.beginPath();
      ctx.arc(lx, ly, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(247, 147, 26, " + (0.15 + pulse * 0.1) + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = LINE_COLOR;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      // Price label
      const priceStr = "$" + displayPrice.current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      ctx.font = "600 11px Inter, -apple-system, sans-serif";
      ctx.fillStyle = LINE_COLOR;
      ctx.textAlign = "right";
      ctx.fillText(priceStr, w - 4, ly - 8);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
    </div>
  );
}

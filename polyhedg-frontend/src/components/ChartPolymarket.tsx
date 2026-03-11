"use client";
/**
 * VARIANT 10: Polymarket Clone - FIXED Y RANGE
 * Y-axis range only EXPANDS, never shrinks. Bumps (gorby) keep their height.
 * Time-based easing between ticks for smooth tip animation.
 * Exactly like Polymarket: stable chart, no breathing/rescaling.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A";
const WINDOW_MS = 90_000;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Time-based interpolation
  const prevPrice = useRef(0);
  const nextPrice = useRef(0);
  const transitionStart = useRef(0);
  const transitionDuration = useRef(300);
  const lastTickTime = useRef(0);
  const displayPrice = useRef(0);

  // FIXED Y range - only expands, never shrinks
  const fixedYMin = useRef(0);
  const fixedYMax = useRef(0);
  const inited = useRef(false);

  const historyRef = useRef<PricePoint[]>([]);
  const pointsRef = useRef<PricePoint[]>([]);
  const lastPointsLen = useRef(0);

  useEffect(() => {
    pointsRef.current = points;

    if (points.length > lastPointsLen.current && points.length >= 2) {
      const now = Date.now();
      const newVal = points[points.length - 1]!.v;

      if (lastTickTime.current > 0) {
        const interval = now - lastTickTime.current;
        transitionDuration.current = Math.max(100, Math.min(1000, interval));
      }

      prevPrice.current = displayPrice.current || newVal;
      nextPrice.current = newVal;
      transitionStart.current = now;
      lastTickTime.current = now;
      historyRef.current = points.slice(0, -1);

      // Only EXPAND Y range, never shrink
      if (inited.current) {
        const pad = (fixedYMax.current - fixedYMin.current) * 0.05;
        if (newVal < fixedYMin.current + pad) fixedYMin.current = newVal - pad * 3;
        if (newVal > fixedYMax.current - pad) fixedYMax.current = newVal + pad * 3;
      }
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
      const tMin = now - WINDOW_MS;
      const visible = historyRef.current.filter(p => p.t >= tMin);

      // Init: set fixed Y range from all seed data
      if (!inited.current && pts.length > 10) {
        const last = pts[pts.length - 1]!;
        displayPrice.current = last.v;
        prevPrice.current = last.v;
        nextPrice.current = last.v;
        transitionStart.current = now;
        lastTickTime.current = now;
        historyRef.current = pts.slice(0, -1);

        let lo = Infinity, hi = -Infinity;
        for (const p of pts) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
        const range = hi - lo || 20;
        // Set generous initial range with 25% padding
        fixedYMin.current = lo - range * 0.25;
        fixedYMax.current = hi + range * 0.25;
        inited.current = true;
      }

      if (!inited.current) { rafRef.current = requestAnimationFrame(tick); return; }

      // Time-based easing
      const elapsed = now - transitionStart.current;
      const progress = Math.min(1, elapsed / transitionDuration.current);
      const eased = easeInOut(progress);
      displayPrice.current = prevPrice.current + (nextPrice.current - prevPrice.current) * eased;

      // Canvas setup
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

      // FIXED Y range - no recalculation
      const rMin = fixedYMin.current;
      const rMax = fixedYMax.current;
      const mapX = (t: number) => ((t - tMin) / (now - tMin)) * w;
      const mapY = (v: number) => h - ((v - rMin) / (rMax - rMin)) * h;

      // Build draw points
      const drawPts: { x: number; y: number }[] = [];
      for (const p of visible) {
        drawPts.push({ x: mapX(p.t), y: mapY(p.v) });
      }
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

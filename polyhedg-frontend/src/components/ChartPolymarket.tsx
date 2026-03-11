"use client";
/**
 * VARIANT 10: Polymarket Clone - Pure Canvas, Smooth Everything
 * ALL values are lerped: price Y positions AND Y-axis range.
 * No TradingView - pure canvas for total control over smoothness.
 * Every frame: lerp display values, lerp Y range, redraw bezier curve.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A";
const PRICE_LERP = 0.05;
const RANGE_LERP = 0.03;
const WINDOW_MS = 90_000;

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const displayY = useRef(0);
  const targetY = useRef(0);
  const rangeMin = useRef(0);
  const rangeMax = useRef(0);
  const rangeMinTarget = useRef(0);
  const rangeMaxTarget = useRef(0);
  const inited = useRef(false);
  const pointsRef = useRef<PricePoint[]>([]);

  useEffect(() => { pointsRef.current = points; }, [points]);

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
      const visible = pts.filter(p => p.t >= tMin);
      if (visible.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      const last = visible[visible.length - 1]!;
      targetY.current = last.v;

      // Init on first frame
      if (!inited.current) {
        displayY.current = last.v;
        let lo = Infinity, hi = -Infinity;
        for (const p of visible) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
        const pad = (hi - lo) * 0.15 || 10;
        rangeMin.current = rangeMinTarget.current = lo - pad;
        rangeMax.current = rangeMaxTarget.current = hi + pad;
        inited.current = true;
      }

      // Lerp display price toward target
      displayY.current += (targetY.current - displayY.current) * PRICE_LERP;

      // Calculate target Y range from all visible points + display value
      let lo = Infinity, hi = -Infinity;
      for (const p of visible) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
      if (displayY.current < lo) lo = displayY.current;
      if (displayY.current > hi) hi = displayY.current;
      const pad = (hi - lo) * 0.15 || 10;
      rangeMinTarget.current = lo - pad;
      rangeMaxTarget.current = hi + pad;

      // Lerp Y range (this prevents the "jump" when range changes)
      rangeMin.current += (rangeMinTarget.current - rangeMin.current) * RANGE_LERP;
      rangeMax.current += (rangeMaxTarget.current - rangeMax.current) * RANGE_LERP;

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

      const rMin = rangeMin.current;
      const rMax = rangeMax.current;
      const mapX = (t: number) => ((t - tMin) / (now - tMin)) * w;
      const mapY = (v: number) => h - ((v - rMin) / (rMax - rMin)) * h;

      // Build points array with lerped "now" point at end
      const drawPts: { x: number; y: number }[] = [];
      for (const p of visible) {
        drawPts.push({ x: mapX(p.t), y: mapY(p.v) });
      }
      // Replace last point Y with lerped display value
      drawPts[drawPts.length - 1] = {
        x: mapX(now),
        y: mapY(displayY.current),
      };

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

      // Price label at right edge
      const priceStr = "$" + displayY.current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

"use client";
/**
 * VARIANT 10: Polymarket Clone - Full UI
 * Fixed Y range, time-based easing, grid lines, price labels,
 * time axis, dashed "price to beat" line - like Polymarket.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A";
const WINDOW_MS = 90_000;
const PAD_R = 70; // right margin for price labels
const PAD_B = 24; // bottom margin for time labels
const PAD_T = 4;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function niceStep(range: number, targetLines: number): number {
  const rough = range / targetLines;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function formatPrice(v: number): string {
  if (v >= 1000) return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return "$" + v.toFixed(2);
}

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return h12 + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + " " + ampm;
}

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const prevPrice = useRef(0);
  const nextPrice = useRef(0);
  const transitionStart = useRef(0);
  const transitionDuration = useRef(300);
  const lastTickTime = useRef(0);
  const displayPrice = useRef(0);
  const fixedYMin = useRef(0);
  const fixedYMax = useRef(0);
  const basePrice = useRef(0); // "price to beat" - first price
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

      if (!inited.current && pts.length > 10) {
        const last = pts[pts.length - 1]!;
        displayPrice.current = last.v;
        prevPrice.current = last.v;
        nextPrice.current = last.v;
        transitionStart.current = now;
        lastTickTime.current = now;
        basePrice.current = pts[0]!.v;
        historyRef.current = pts.slice(0, -1);
        let lo = Infinity, hi = -Infinity;
        for (const p of pts) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
        const range = hi - lo || 20;
        fixedYMin.current = lo - range * 0.25;
        fixedYMax.current = hi + range * 0.25;
        inited.current = true;
      }
      if (!inited.current) { rafRef.current = requestAnimationFrame(tick); return; }

      const elapsed = now - transitionStart.current;
      const progress = Math.min(1, elapsed / transitionDuration.current);
      displayPrice.current = prevPrice.current + (nextPrice.current - prevPrice.current) * easeInOut(progress);

      const visible = historyRef.current.filter(p => p.t >= tMin);

      // Canvas
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const chartW = w - PAD_R;
      const chartH = h - PAD_B - PAD_T;
      const rMin = fixedYMin.current;
      const rMax = fixedYMax.current;
      const mapX = (t: number) => ((t - tMin) / (now - tMin)) * chartW;
      const mapY = (v: number) => PAD_T + chartH - ((v - rMin) / (rMax - rMin)) * chartH;

      // --- GRID LINES (horizontal) ---
      const yRange = rMax - rMin;
      const step = niceStep(yRange, 4);
      const firstLine = Math.ceil(rMin / step) * step;
      ctx.font = "400 10px Inter, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let v = firstLine; v <= rMax; v += step) {
        const y = mapY(v);
        if (y < PAD_T || y > PAD_T + chartH) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(chartW, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(formatPrice(v), chartW + 8, y);
      }

      // --- TIME AXIS (bottom) ---
      const timeStep = WINDOW_MS > 120000 ? 30000 : 15000;
      const tStart = Math.ceil(tMin / timeStep) * timeStep;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "400 9px Inter, -apple-system, sans-serif";
      for (let t = tStart; t <= now; t += timeStep) {
        const x = mapX(t);
        if (x < 30 || x > chartW - 30) continue;
        // Tick mark
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, PAD_T);
        ctx.lineTo(Math.round(x) + 0.5, PAD_T + chartH);
        ctx.stroke();
        // Label
        const d = new Date(t);
        ctx.fillText(formatTime(d), x, PAD_T + chartH + 6);
      }

      // --- DASHED "Price to beat" LINE ---
      if (basePrice.current > rMin && basePrice.current < rMax) {
        const by = mapY(basePrice.current);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(247, 147, 26, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(by) + 0.5);
        ctx.lineTo(chartW, Math.round(by) + 0.5);
        ctx.stroke();
        ctx.restore();
        // Label
        ctx.fillStyle = "rgba(247, 147, 26, 0.5)";
        ctx.font = "500 9px Inter, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(formatPrice(basePrice.current), chartW + 8, by - 2);
      }

      // --- CHART LINE ---
      const drawPts: { x: number; y: number }[] = [];
      for (const p of visible) drawPts.push({ x: mapX(p.t), y: mapY(p.v) });
      drawPts.push({ x: mapX(now), y: mapY(displayPrice.current) });

      if (drawPts.length >= 2) {
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
        ctx.lineTo(lx, PAD_T + chartH);
        ctx.lineTo(first.x, PAD_T + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
        grad.addColorStop(0, "rgba(247, 147, 26, 0.15)");
        grad.addColorStop(1, "rgba(247, 147, 26, 0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Current price highlight line (horizontal dashed to right edge)
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(chartW, ly);
        ctx.stroke();
        ctx.restore();

        // Price badge on right
        const priceStr = formatPrice(displayPrice.current);
        ctx.font = "600 10px Inter, -apple-system, sans-serif";
        const tw = ctx.measureText(priceStr).width;
        const bx = chartW + 4;
        const bh = 18;
        const by2 = ly - bh / 2;
        ctx.fillStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.roundRect(bx, by2, tw + 12, bh, 3);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(priceStr, bx + 6, ly);

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
      }

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

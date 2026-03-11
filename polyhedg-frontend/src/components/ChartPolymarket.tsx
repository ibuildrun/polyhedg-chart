"use client";
/**
 * VARIANT 10: Polymarket Clone - Full UI + Smooth Animation
 * Time-based easing between ticks. Y-range slowly adapts via lerp.
 * Grid lines, price labels on right, time labels on bottom,
 * dashed "price to beat" line, orange price badge - like Polymarket.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#F7931A";
const WINDOW_MS = 90_000;
const PAD_R = 65;
const PAD_B = 22;
const PAD_T = 2;
const RANGE_LERP = 0.015; // slow Y-range breathing

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function niceStep(range: number, target: number): number {
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function fmtPrice(v: number): string {
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: v >= 1000 ? 0 : 2, maximumFractionDigits: v >= 1000 ? 0 : 2 });
}

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return h + ":" + m + ":" + s;
}

export default function ChartPolymarket({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const prevPrice = useRef(0);
  const nextPrice = useRef(0);
  const transStart = useRef(0);
  const transDur = useRef(300);
  const lastTick = useRef(0);
  const dispPrice = useRef(0);
  const basePrice = useRef(0);
  // Smooth Y range (lerp)
  const yMin = useRef(0);
  const yMax = useRef(0);
  const yMinT = useRef(0);
  const yMaxT = useRef(0);
  const inited = useRef(false);
  const histRef = useRef<PricePoint[]>([]);
  const ptsRef = useRef<PricePoint[]>([]);
  const lastLen = useRef(0);

  useEffect(() => {
    ptsRef.current = points;
    if (points.length > lastLen.current && points.length >= 2) {
      const now = Date.now();
      const v = points[points.length - 1]!.v;
      if (lastTick.current > 0) {
        transDur.current = Math.max(100, Math.min(1000, now - lastTick.current));
      }
      prevPrice.current = dispPrice.current || v;
      nextPrice.current = v;
      transStart.current = now;
      lastTick.current = now;
      histRef.current = points.slice(0, -1);
    }
    lastLen.current = points.length;
  }, [points]);

  useEffect(() => {
    const tick = () => {
      const canvas = canvasRef.current;
      const box = containerRef.current;
      const pts = ptsRef.current;
      if (!canvas || !box || pts.length < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      const now = Date.now();
      const tMin = now - WINDOW_MS;

      // Init
      if (!inited.current && pts.length > 10) {
        const last = pts[pts.length - 1]!;
        dispPrice.current = last.v;
        prevPrice.current = last.v;
        nextPrice.current = last.v;
        transStart.current = now;
        lastTick.current = now;
        basePrice.current = pts[0]!.v;
        histRef.current = pts.slice(0, -1);
        let lo = Infinity, hi = -Infinity;
        for (const p of pts) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
        const r = hi - lo || 20;
        yMin.current = yMinT.current = lo - r * 0.2;
        yMax.current = yMaxT.current = hi + r * 0.2;
        inited.current = true;
      }
      if (!inited.current) { rafRef.current = requestAnimationFrame(tick); return; }

      // Time-based easing for price
      const el = now - transStart.current;
      const prog = Math.min(1, el / transDur.current);
      dispPrice.current = prevPrice.current + (nextPrice.current - prevPrice.current) * easeInOut(prog);

      const visible = histRef.current.filter(p => p.t >= tMin);

      // Compute target Y range from visible data
      let lo = Infinity, hi = -Infinity;
      for (const p of visible) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; }
      const dp = dispPrice.current;
      if (dp < lo) lo = dp;
      if (dp > hi) hi = dp;
      if (lo === Infinity) { lo = dp - 10; hi = dp + 10; }
      const r = (hi - lo) * 0.2 || 10;
      yMinT.current = lo - r;
      yMaxT.current = hi + r;
      // Lerp Y range (slow breathing like Polymarket)
      yMin.current += (yMinT.current - yMin.current) * RANGE_LERP;
      yMax.current += (yMaxT.current - yMax.current) * RANGE_LERP;

      // Canvas
      const dpr = window.devicePixelRatio || 1;
      const w = box.clientWidth;
      const h = box.clientHeight;
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cW = w - PAD_R;
      const cH = h - PAD_B - PAD_T;
      const rn = yMin.current;
      const rx = yMax.current;
      const mx = (t: number) => ((t - tMin) / (now - tMin)) * cW;
      const my = (v: number) => PAD_T + cH - ((v - rn) / (rx - rn)) * cH;

      // --- HORIZONTAL GRID + PRICE LABELS ---
      const yRange = rx - rn;
      const step = niceStep(yRange, 4);
      const fl = Math.ceil(rn / step) * step;
      ctx.textBaseline = "middle";
      for (let v = fl; v <= rx; v += step) {
        const y = my(v);
        if (y < PAD_T + 5 || y > PAD_T + cH - 5) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(cW, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.font = "400 10px Inter, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "left";
        ctx.fillText(fmtPrice(v), cW + 6, y);
      }

      // --- VERTICAL GRID + TIME LABELS ---
      const tStep = WINDOW_MS > 120000 ? 30000 : 15000;
      const ts = Math.ceil(tMin / tStep) * tStep;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.font = "400 9px Inter, -apple-system, sans-serif";
      for (let t = ts; t <= now; t += tStep) {
        const x = mx(t);
        if (x < 25 || x > cW - 25) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, PAD_T);
        ctx.lineTo(Math.round(x) + 0.5, PAD_T + cH);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillText(fmtTime(t), x, PAD_T + cH + 5);
      }

      // --- DASHED "Price to beat" LINE ---
      if (basePrice.current > rn && basePrice.current < rx) {
        const by = my(basePrice.current);
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "rgba(247,147,26,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(by) + 0.5);
        ctx.lineTo(cW, Math.round(by) + 0.5);
        ctx.stroke();
        ctx.restore();
      }

      // --- CHART LINE ---
      const dp2: { x: number; y: number }[] = [];
      for (const p of visible) dp2.push({ x: mx(p.t), y: my(p.v) });
      dp2.push({ x: mx(now), y: my(dp) });

      if (dp2.length >= 2) {
        ctx.beginPath();
        const f = dp2[0]!;
        ctx.moveTo(f.x, f.y);
        let lx = f.x, ly = f.y;
        for (let i = 1; i < dp2.length; i++) {
          const p = dp2[i]!;
          ctx.quadraticCurveTo(lx, ly, (lx + p.x) / 2, (ly + p.y) / 2);
          lx = p.x; ly = p.y;
        }
        ctx.lineTo(lx, ly);
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        // Fill
        ctx.lineTo(lx, PAD_T + cH);
        ctx.lineTo(f.x, PAD_T + cH);
        ctx.closePath();
        const gr = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + cH);
        gr.addColorStop(0, "rgba(247,147,26,0.12)");
        gr.addColorStop(1, "rgba(247,147,26,0)");
        ctx.fillStyle = gr;
        ctx.fill();

        // Dashed line from tip to right edge
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(247,147,26,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(cW, ly);
        ctx.stroke();
        ctx.restore();

        // Price badge on right axis
        const ps = fmtPrice(dp);
        ctx.font = "600 10px Inter, -apple-system, sans-serif";
        const tw = ctx.measureText(ps).width;
        const bx = cW + 2;
        const bw = tw + 10;
        const bh = 16;
        const by2 = ly - bh / 2;
        // Badge background
        ctx.fillStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.roundRect(bx, by2, bw, bh, 3);
        ctx.fill();
        // Badge text
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(ps, bx + 5, ly + 0.5);

        // Pulsing dot
        const pulse = 0.5 + 0.5 * Math.sin(now / 400);
        ctx.beginPath();
        ctx.arc(lx, ly, 4 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(247,147,26," + (0.15 + pulse * 0.1) + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = LINE_COLOR;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, 1, 0, Math.PI * 2);
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

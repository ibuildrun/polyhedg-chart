"use client";
/**
 * ВАРИАНТ 6: Canvas + Catmull-Rom Spline + Высокочастотная интерполяция
 * Между каждой парой реальных точек генерируется 20 промежуточных
 * через Catmull-Rom сплайн. Это создаёт очень плавную кривую.
 * Плюс lerp для текущей цены.
 */
import { useRef, useEffect, useCallback } from "react";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#a855f7";
const FILL_TOP = "rgba(168, 85, 247, 0.2)";
const WINDOW_MS = 90_000;

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export default function ChartCanvasSpline({ points, latest }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const dispVal = useRef(0);

  useEffect(() => {
    if (dispVal.current === 0 && latest > 0) dispVal.current = latest;
  }, [latest]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const box = containerRef.current;
    if (!canvas || !box) { animRef.current = requestAnimationFrame(render); return; }

    const dpr = window.devicePixelRatio || 1;
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) { animRef.current = requestAnimationFrame(render); return; }
    const cw = Math.floor(w * dpr), ch = Math.floor(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Lerp
    dispVal.current += (latest - dispVal.current) * 0.1;

    const now = Date.now();
    const tMin = now - WINDOW_MS;
    const data = points.filter(p => p.t >= tMin);
    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // Add virtual now point
    const all = [...data, { t: now, v: dispVal.current }];

    let vMin = Infinity, vMax = -Infinity;
    for (const p of all) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
    const pad = (vMax - vMin) * 0.15 || 10;
    vMin -= pad; vMax += pad;

    const mx = (t: number) => ((t - tMin) / (now - tMin)) * w;
    const my = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

    // Generate interpolated points via Catmull-Rom
    const interp: { x: number; y: number }[] = [];
    const STEPS = 16;
    for (let i = 0; i < all.length; i++) {
      const p0 = all[Math.max(0, i - 1)]!;
      const p1 = all[i]!;
      const p2 = all[Math.min(all.length - 1, i + 1)]!;
      const p3 = all[Math.min(all.length - 1, i + 2)]!;

      if (i < all.length - 1) {
        for (let s = 0; s < STEPS; s++) {
          const t = s / STEPS;
          interp.push({
            x: catmullRom(mx(p0.t), mx(p1.t), mx(p2.t), mx(p3.t), t),
            y: catmullRom(my(p0.v), my(p1.v), my(p2.v), my(p3.v), t),
          });
        }
      } else {
        interp.push({ x: mx(p1.t), y: my(p1.v) });
      }
    }

    if (interp.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // Draw
    ctx.beginPath();
    ctx.moveTo(interp[0]!.x, interp[0]!.y);
    for (let i = 1; i < interp.length; i++) ctx.lineTo(interp[i]!.x, interp[i]!.y);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill
    const last = interp[interp.length - 1]!;
    const first = interp[0]!;
    ctx.lineTo(last.x, h);
    ctx.lineTo(first.x, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, FILL_TOP);
    grad.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Dot
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + pulse * 0.1})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = COLOR;
    ctx.fill();

    animRef.current = requestAnimationFrame(render);
  }, [points, latest]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
    </div>
  );
}

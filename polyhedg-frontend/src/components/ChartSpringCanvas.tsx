"use client";
/**
 * ВАРИАНТ 8: Canvas + Spring Physics
 * Каждая точка на графике имеет "пружинную" физику —
 * при обновлении значения точка не прыгает, а колеблется
 * вокруг нового значения с затуханием (damped spring).
 * Это создаёт органичное, "живое" движение.
 */
import { useRef, useEffect, useCallback } from "react";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#f43f5e";
const FILL_TOP = "rgba(244, 63, 94, 0.2)";
const WINDOW_MS = 90_000;
const SPRING_K = 0.08;   // stiffness
const SPRING_D = 0.7;    // damping

export default function ChartSpringCanvas({ points, latest }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  // Spring state for display value
  const pos = useRef(0);
  const vel = useRef(0);
  const target = useRef(0);

  useEffect(() => {
    target.current = latest;
    if (pos.current === 0 && latest > 0) pos.current = latest;
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

    // Spring physics for current value
    const force = SPRING_K * (target.current - pos.current);
    vel.current = vel.current * SPRING_D + force;
    pos.current += vel.current;

    const now = Date.now();
    const tMin = now - WINDOW_MS;
    const data = points.filter(p => p.t >= tMin);
    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    const all = [...data, { t: now, v: pos.current }];

    let vMin = Infinity, vMax = -Infinity;
    for (const p of all) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
    const pad = (vMax - vMin) * 0.15 || 10;
    vMin -= pad; vMax += pad;

    const mx = (t: number) => ((t - tMin) / (now - tMin)) * w;
    const my = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

    // Draw with quadratic bezier
    ctx.beginPath();
    let fx = mx(all[0]!.t), fy = my(all[0]!.v);
    ctx.moveTo(fx, fy);
    let lx = fx, ly = fy;

    for (let i = 1; i < all.length; i++) {
      const x = mx(all[i]!.t);
      const y = my(all[i]!.v);
      const midX = (lx + x) / 2;
      const midY = (ly + y) / 2;
      ctx.quadraticCurveTo(lx, ly, midX, midY);
      lx = x; ly = y;
    }
    ctx.lineTo(lx, ly);

    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill
    ctx.lineTo(lx, h);
    ctx.lineTo(fx, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, FILL_TOP);
    grad.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Pulsing dot with spring bounce
    const springBounce = Math.abs(vel.current) * 0.5;
    const dotR = 4 + Math.min(springBounce, 4);
    ctx.beginPath();
    ctx.arc(lx, ly, dotR + 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 63, 94, 0.15)`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, dotR, 0, Math.PI * 2);
    ctx.fillStyle = COLOR;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

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

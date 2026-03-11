"use client";
/**
 * ВАРИАНТ 8: Canvas + Spring Physics
 * Каждая новая цена — это "цель" для пружины. Display value
 * движется к цели через spring-damper систему (как react-spring).
 * Это даёт самую "живую" анимацию с лёгким overshoot.
 * Quadratic bezier для кривой.
 */
import { useRef, useEffect, useCallback } from "react";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#f43f5e";
const FILL_TOP = "rgba(244, 63, 94, 0.18)";
const WINDOW_MS = 90_000;

// Spring constants
const STIFFNESS = 120;
const DAMPING = 14;
const MASS = 1;

export default function ChartSpring({ points, latest }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const springPos = useRef(0);
  const springVel = useRef(0);
  const lastTime = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && latest > 0) {
      springPos.current = latest;
      initialized.current = true;
    }
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

    // Spring physics step
    const now = performance.now();
    const dt = lastTime.current ? Math.min((now - lastTime.current) / 1000, 0.05) : 0.016;
    lastTime.current = now;

    const target = latest;
    const displacement = springPos.current - target;
    const springForce = -STIFFNESS * displacement;
    const dampingForce = -DAMPING * springVel.current;
    const acceleration = (springForce + dampingForce) / MASS;
    springVel.current += acceleration * dt;
    springPos.current += springVel.current * dt;

    const nowMs = Date.now();
    const tMin = nowMs - WINDOW_MS;
    const data = points.filter(p => p.t >= tMin);
    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // Virtual now point at spring position
    const all = [...data, { t: nowMs, v: springPos.current }];

    let vMin = Infinity, vMax = -Infinity;
    for (const p of all) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
    const pad = (vMax - vMin) * 0.15 || 10;
    vMin -= pad; vMax += pad;

    const mx = (t: number) => ((t - tMin) / (nowMs - tMin)) * w;
    const my = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

    // Draw quadratic bezier curve
    ctx.beginPath();
    const fx = mx(all[0]!.t), fy = my(all[0]!.v);
    ctx.moveTo(fx, fy);
    let lx = fx, ly = fy;

    for (let i = 1; i < all.length; i++) {
      const x = mx(all[i]!.t), y = my(all[i]!.v);
      const midX = (lx + x) / 2, midY = (ly + y) / 2;
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

    // Pulsing dot
    const pulse = 0.5 + 0.5 * Math.sin(nowMs / 300);
    ctx.beginPath();
    ctx.arc(lx, ly, 5 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 63, 94, ${0.2 + pulse * 0.1})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
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

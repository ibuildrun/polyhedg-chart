"use client";
/**
 * ВАРИАНТ 2: Custom Canvas + субпиксельный Lerp
 * Каждая новая точка НЕ появляется мгновенно — displayValue плавно
 * "плывёт" к targetValue через lerp на каждом кадре (60fps).
 * Линия рисуется через quadratic bezier для плавности.
 * Весь canvas скроллится непрерывно.
 */
import { useRef, useEffect, useCallback } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#10b981";
const FILL_TOP = "rgba(16, 185, 129, 0.18)";
const FILL_BOT = "rgba(16, 185, 129, 0)";
const WINDOW_MS = 90_000;

export default function ChartCanvasLerp({ points, latest }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const displayVal = useRef(0);
  const targetVal = useRef(0);

  useEffect(() => {
    targetVal.current = latest;
    if (displayVal.current === 0) displayVal.current = latest;
  }, [latest]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) { animRef.current = requestAnimationFrame(render); return; }

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(render); return; }

    const cw = Math.floor(w * dpr);
    const ch = Math.floor(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Lerp display value
    displayVal.current += (targetVal.current - displayVal.current) * 0.12;

    const now = Date.now();
    const tMin = now - WINDOW_MS;
    const data = points.filter(p => p.t >= tMin);
    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // Add virtual "now" point at lerped value
    const allPts = [...data, { t: now, v: displayVal.current }];

    // Y range
    let vMin = Infinity, vMax = -Infinity;
    for (const p of allPts) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
    const pad = (vMax - vMin) * 0.15 || 10;
    vMin -= pad; vMax += pad;

    const mapX = (t: number) => ((t - tMin) / (now - tMin)) * w;
    const mapY = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

    // Draw smooth curve with quadratic bezier
    ctx.beginPath();
    let fx = mapX(allPts[0]!.t), fy = mapY(allPts[0]!.v);
    ctx.moveTo(fx, fy);
    let lx = fx, ly = fy;

    for (let i = 1; i < allPts.length; i++) {
      const x = mapX(allPts[i]!.t);
      const y = mapY(allPts[i]!.v);
      const mx = (lx + x) / 2;
      const my = (ly + y) / 2;
      ctx.quadraticCurveTo(lx, ly, mx, my);
      lx = x; ly = y;
    }
    ctx.lineTo(lx, ly);

    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill
    ctx.lineTo(lx, h);
    ctx.lineTo(fx, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, FILL_TOP);
    grad.addColorStop(1, FILL_BOT);
    ctx.fillStyle = grad;
    ctx.fill();

    // Dot
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.beginPath();
    ctx.arc(lx, ly, 5 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${0.2 + pulse * 0.1})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = LINE_COLOR;
    ctx.fill();

    animRef.current = requestAnimationFrame(render);
  }, [points]);

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

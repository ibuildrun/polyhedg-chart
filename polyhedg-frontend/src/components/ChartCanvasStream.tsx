"use client";
/**
 * ВАРИАНТ 4: Canvas Continuous Stream (SmoothieCharts-стиль)
 * Непрерывный скролл canvas влево. Время привязано к пиксельной сетке.
 * Cubic bezier между точками. Самый близкий к SmoothieCharts подход,
 * но написан с нуля.
 */
import { useRef, useEffect, useCallback } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#ec4899";
const FILL_TOP = "rgba(236, 72, 153, 0.18)";
const FILL_BOT = "rgba(236, 72, 153, 0)";
const MS_PER_PX = 120;
const SCALE_SMOOTH = 0.08;

export default function ChartCanvasStream({ points }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const curRange = useRef(1);
  const curMin = useRef(0);

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

    // Snap time to pixel grid — key smoothie trick
    let time = Date.now();
    time -= time % MS_PER_PX;

    const oldest = time - w * MS_PER_PX;
    const data = points.filter(p => p.t >= oldest && p.t <= time);
    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // Smooth Y scaling
    let vMax = -Infinity, vMin = Infinity;
    for (const p of data) { if (p.v > vMax) vMax = p.v; if (p.v < vMin) vMin = p.v; }
    const pad = (vMax - vMin) * 0.12 || 10;
    vMax += pad; vMin -= pad;
    const targetRange = vMax - vMin;
    curRange.current += SCALE_SMOOTH * (targetRange - curRange.current);
    curMin.current += SCALE_SMOOTH * (vMin - curMin.current);

    const timeToX = (t: number) => w - (time - t) / MS_PER_PX;
    const valToY = (v: number) => curRange.current === 0 ? h / 2 : h * (1 - (v - curMin.current) / curRange.current);

    // Draw cubic bezier curve
    ctx.beginPath();
    let fx = timeToX(data[0]!.t), fy = valToY(data[0]!.v);
    ctx.moveTo(fx, fy);
    let lx = fx, ly = fy;

    for (let i = 1; i < data.length; i++) {
      const x = timeToX(data[i]!.t);
      const y = valToY(data[i]!.v);
      const midX = (lx + x) / 2;
      ctx.bezierCurveTo(midX, ly, midX, y, x, y);
      lx = x; ly = y;
    }

    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
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
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    ctx.beginPath();
    ctx.arc(lx, ly, 5 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(236, 72, 153, ${0.2 + pulse * 0.1})`;
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

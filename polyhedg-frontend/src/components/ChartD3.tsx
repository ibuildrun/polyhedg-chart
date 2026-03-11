"use client";
/**
 * ВАРИАНТ 5: D3 Monotone Curve + SVG
 * d3-shape генерирует monotoneX кривую — самый плавный тип интерполяции,
 * который гарантирует что кривая не "перелетает" через точки данных.
 * CSS transition анимирует path d.
 */
import { useMemo } from "react";
import { line, area, curveMonotoneX } from "d3-shape";
import { scaleLinear } from "d3-scale";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#06b6d4";
const WINDOW_MS = 90_000;

export default function ChartD3({ points }: { points: PricePoint[] }) {
  const { linePath, areaPath, w, h } = useMemo(() => {
    const w = 800, h = 300;
    const now = Date.now();
    const tMin = now - WINDOW_MS;
    const filtered = points.filter(p => p.t >= tMin);
    if (filtered.length < 2) return { linePath: "", areaPath: "", w, h };

    let vMin = Infinity, vMax = -Infinity;
    for (const p of filtered) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
    const pad = (vMax - vMin) * 0.15 || 10;

    const xScale = scaleLinear().domain([tMin, now]).range([0, w]);
    const yScale = scaleLinear().domain([vMin - pad, vMax + pad]).range([h, 0]);

    const lineGen = line<PricePoint>()
      .x(d => xScale(d.t))
      .y(d => yScale(d.v))
      .curve(curveMonotoneX);

    const areaGen = area<PricePoint>()
      .x(d => xScale(d.t))
      .y0(h)
      .y1(d => yScale(d.v))
      .curve(curveMonotoneX);

    return {
      linePath: lineGen(filtered) || "",
      areaPath: areaGen(filtered) || "",
      w, h,
    };
  }, [points]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="d3Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.25)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#d3Grad)" style={{ transition: "d 0.3s ease-out" }} />
        <path d={linePath} fill="none" stroke={COLOR} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ transition: "d 0.3s ease-out" }} />
      </svg>
    </div>
  );
}

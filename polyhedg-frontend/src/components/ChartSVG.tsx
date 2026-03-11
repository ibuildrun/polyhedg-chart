"use client";
/**
 * ВАРИАНТ 3: SVG Path + CSS Transition
 * SVG path пересчитывается при каждом обновлении данных,
 * а CSS transition на атрибуте d делает плавный морфинг.
 * Плюс: нативная анимация браузера, минус: может быть медленнее на большом кол-ве точек.
 */
import { useMemo } from "react";
import type { PricePoint } from "./usePolymarketData";

const LINE_COLOR = "#f59e0b";
const WINDOW_MS = 90_000;
const W = 800;
const H = 300;

function buildPath(data: PricePoint[], w: number, h: number, close = false): string {
  if (data.length < 2) return "";
  const now = Date.now();
  const tMin = now - WINDOW_MS;
  const filtered = data.filter(p => p.t >= tMin);
  if (filtered.length < 2) return "";

  let vMin = Infinity, vMax = -Infinity;
  for (const p of filtered) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
  const pad = (vMax - vMin) * 0.15 || 10;
  vMin -= pad; vMax += pad;

  const mapX = (t: number) => ((t - tMin) / (now - tMin)) * w;
  const mapY = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

  let d = `M ${mapX(filtered[0]!.t).toFixed(1)} ${mapY(filtered[0]!.v).toFixed(1)}`;

  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1]!;
    const curr = filtered[i]!;
    const px = mapX(prev.t), py = mapY(prev.v);
    const cx = mapX(curr.t), cy = mapY(curr.v);
    const mx = ((px + cx) / 2).toFixed(1);
    // Quadratic bezier through midpoint
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${mx} ${((py + cy) / 2).toFixed(1)}`;
  }
  const last = filtered[filtered.length - 1]!;
  d += ` L ${mapX(last.t).toFixed(1)} ${mapY(last.v).toFixed(1)}`;

  if (close) {
    d += ` L ${mapX(last.t).toFixed(1)} ${h} L ${mapX(filtered[0]!.t).toFixed(1)} ${h} Z`;
  }

  return d;
}

export default function ChartSVG({ points }: { points: PricePoint[]; latest: number }) {
  const linePath = useMemo(() => buildPath(points, W, H), [points]);
  const fillPath = useMemo(() => buildPath(points, W, H, true), [points]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="svgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.2)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </linearGradient>
        </defs>
        <path
          d={fillPath}
          fill="url(#svgGrad)"
          style={{ transition: "d 0.3s ease-out" }}
        />
        <path
          d={linePath}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: "d 0.3s ease-out" }}
        />
      </svg>
    </div>
  );
}

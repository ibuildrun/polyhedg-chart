"use client";
/**
 * ВАРИАНТ 9: SVG + requestAnimationFrame Morph
 * Вместо CSS transition, анимация path d через rAF.
 * Каждый кадр интерполирует между текущим и целевым path.
 * Это даёт более контролируемую и плавную анимацию чем CSS.
 */
import { useRef, useEffect, useCallback, useState } from "react";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#14b8a6";
const WINDOW_MS = 90_000;
const W = 800;
const H = 300;
const LERP = 0.06;

function computePath(pts: PricePoint[], w: number, h: number, close: boolean): number[] {
  const now = Date.now();
  const tMin = now - WINDOW_MS;
  const filtered = pts.filter(p => p.t >= tMin);
  if (filtered.length < 2) return [];

  let vMin = Infinity, vMax = -Infinity;
  for (const p of filtered) { if (p.v < vMin) vMin = p.v; if (p.v > vMax) vMax = p.v; }
  const pad = (vMax - vMin) * 0.15 || 10;
  vMin -= pad; vMax += pad;

  const coords: number[] = [];
  for (const p of filtered) {
    coords.push(((p.t - tMin) / (now - tMin)) * w);
    coords.push(h - ((p.v - vMin) / (vMax - vMin)) * h);
  }
  return coords;
}

function coordsToSVG(coords: number[], close: boolean, h: number): string {
  if (coords.length < 4) return "";
  let d = `M ${coords[0]!.toFixed(1)} ${coords[1]!.toFixed(1)}`;
  for (let i = 2; i < coords.length - 2; i += 2) {
    const px = coords[i - 2]!, py = coords[i - 1]!;
    const cx = coords[i]!, cy = coords[i + 1]!;
    const mx = ((px + cx) / 2).toFixed(1);
    const my = ((py + cy) / 2).toFixed(1);
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${mx} ${my}`;
  }
  const lx = coords[coords.length - 2]!, ly = coords[coords.length - 1]!;
  d += ` L ${lx.toFixed(1)} ${ly.toFixed(1)}`;
  if (close) {
    d += ` L ${lx.toFixed(1)} ${h} L ${coords[0]!.toFixed(1)} ${h} Z`;
  }
  return d;
}

export default function ChartSVGAnimated({ points }: { points: PricePoint[] }) {
  const animRef = useRef(0);
  const currentCoords = useRef<number[]>([]);
  const targetCoords = useRef<number[]>([]);
  const [linePath, setLinePath] = useState("");
  const [fillPath, setFillPath] = useState("");

  // Update target on new data
  useEffect(() => {
    targetCoords.current = computePath(points, W, H, false);
  }, [points]);

  const animate = useCallback(() => {
    const target = targetCoords.current;
    if (target.length < 4) { animRef.current = requestAnimationFrame(animate); return; }

    let cur = currentCoords.current;
    // Match lengths
    if (cur.length !== target.length) {
      cur = [...target];
      currentCoords.current = cur;
    }

    // Lerp each coordinate
    let changed = false;
    for (let i = 0; i < cur.length; i++) {
      const diff = target[i]! - cur[i]!;
      if (Math.abs(diff) > 0.01) {
        cur[i] = cur[i]! + diff * LERP;
        changed = true;
      }
    }

    if (changed || true) { // always update for smooth scroll
      setLinePath(coordsToSVG(cur, false, H));
      setFillPath(coordsToSVG(cur, true, H));
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="svgAnimGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(20, 184, 166, 0.25)" />
            <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#svgAnimGrad)" />
        <path d={linePath} fill="none" stroke={COLOR} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

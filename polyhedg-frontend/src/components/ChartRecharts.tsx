"use client";
/**
 * ВАРИАНТ 9: Recharts
 * Самая популярная React chart библиотека. SVG-based.
 * AreaChart с monotone кривой и анимацией.
 * npm: recharts
 */
import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import type { PricePoint } from "./usePolymarketData";

const COLOR = "#84cc16";
const WINDOW_MS = 90_000;

export default function ChartRecharts({ points }: { points: PricePoint[] }) {
  const data = useMemo(() => {
    const now = Date.now();
    const tMin = now - WINDOW_MS;
    return points
      .filter(p => p.t >= tMin)
      .map(p => ({ t: p.t, v: p.v }));
  }, [points]);

  if (data.length < 2) return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Loading...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="rechartsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR} stopOpacity={0.25} />
            <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={["auto", "auto"]} hide />
        <Area
          type="monotone"
          dataKey="v"
          stroke={COLOR}
          strokeWidth={2}
          fill="url(#rechartsGrad)"
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

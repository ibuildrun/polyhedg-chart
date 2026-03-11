"use client";

import { useState } from "react";
import { usePolymarketData } from "~/components/usePolymarketData";
import ChartSmoothie from "~/components/ChartSmoothie";
import ChartCanvasLerp from "~/components/ChartCanvasLerp";
import ChartSVG from "~/components/ChartSVG";
import ChartCanvasStream from "~/components/ChartCanvasStream";
import ChartD3 from "~/components/ChartD3";
import ChartCanvasSpline from "~/components/ChartCanvasSpline";
import ChartTradingView from "~/components/ChartTradingView";
import ChartSpringCanvas from "~/components/ChartSpringCanvas";
import ChartSVGAnimated from "~/components/ChartSVGAnimated";

interface ChartVariant {
  id: number;
  title: string;
  lib: string;
  libColor: string;
  desc: string;
  render: (p: { points: any[]; latest: number }) => React.ReactNode;
}

const variants: ChartVariant[] = [
  { id: 1, title: "SmoothieCharts", lib: "npm: smoothie", libColor: "#8b5cf6", desc: "Библиотека для плавного стриминга. Непрерывный скролл canvas, bezier интерполяция, pixel-snap time.", render: (p) => <ChartSmoothie points={p.points} latest={p.latest} /> },
  { id: 2, title: "Canvas + Lerp", lib: "custom canvas", libColor: "#10b981", desc: "Субпиксельный lerp: displayValue плавно плывёт к target на 60fps. Quadratic bezier кривые.", render: (p) => <ChartCanvasLerp points={p.points} latest={p.latest} /> },
  { id: 3, title: "SVG + CSS Transition", lib: "svg path morph", libColor: "#f59e0b", desc: "SVG path пересчитывается при обновлении, CSS transition анимирует морфинг. Нативная анимация браузера.", render: (p) => <ChartSVG points={p.points} latest={p.latest} /> },
  { id: 4, title: "Canvas Stream", lib: "smoothie-style", libColor: "#ec4899", desc: "SmoothieCharts-стиль с нуля: pixel-snap time, cubic bezier, smooth Y scaling.", render: (p) => <ChartCanvasStream points={p.points} latest={p.latest} /> },
  { id: 5, title: "D3 Monotone Curve", lib: "d3-shape", libColor: "#06b6d4", desc: "d3-shape monotoneX  самый плавный тип кривой, гарантирует отсутствие overshooting.", render: (p) => <ChartD3 points={p.points} /> },
  { id: 6, title: "Canvas Catmull-Rom", lib: "catmull-rom spline", libColor: "#a855f7", desc: "Catmull-Rom сплайн с 16x интерполяцией между точками + lerp текущей цены.", render: (p) => <ChartCanvasSpline points={p.points} latest={p.latest} /> },
  { id: 7, title: "TradingView", lib: "lightweight-charts", libColor: "#3b82f6", desc: "Профессиональная библиотека для финансовых графиков. Area series, crosshair, автоскейлинг.", render: (p) => <ChartTradingView points={p.points} /> },
  { id: 8, title: "Canvas Spring Physics", lib: "spring damper", libColor: "#f43f5e", desc: "Пружинная физика: при обновлении цена колеблется вокруг нового значения с затуханием.", render: (p) => <ChartSpringCanvas points={p.points} latest={p.latest} /> },
  { id: 9, title: "SVG rAF Morph", lib: "svg + raf lerp", libColor: "#14b8a6", desc: "SVG path анимируется через requestAnimationFrame  каждый кадр lerp координат к целевым.", render: (p) => <ChartSVGAnimated points={p.points} /> },
];

function StatBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ color: color || "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

export default function ChartDemoPage() {
  const data = usePolymarketData("btc/usd");
  const [expanded, setExpanded] = useState<number | null>(null);
  const mc = data.mode === "live" ? "#22c55e" : data.mode === "simulated" ? "#f59e0b" : "#6b7280";
  const ml = data.mode === "live" ? "LIVE" : data.mode === "simulated" ? "DEMO" : "...";
  const changeColor = data.change >= 0 ? "#22c55e" : "#ef4444";
  const changeSign = data.change >= 0 ? "+" : "";
  const expandedVariant = expanded !== null ? variants.find(v => v.id === expanded) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", padding: "20px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>BTC / USD  Chart Comparison</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "4px 0 0" }}>9 подходов к рендерингу  один источник данных (Polymarket RTDS)  клик для увеличения</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <StatBadge label="High" value={`$${data.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <StatBadge label="Low" value={`$${data.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <StatBadge label="Change" value={`${changeSign}${data.change.toFixed(2)} (${changeSign}${data.changePct.toFixed(3)}%)`} color={changeColor} />
            <StatBadge label="Points" value={`${data.pointCount}`} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${mc}12`, border: `1px solid ${mc}30`, borderRadius: 16, padding: "3px 10px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: mc, boxShadow: `0 0 6px ${mc}` }} />
              <span style={{ color: mc, fontSize: 10, fontWeight: 600 }}>{ml}</span>
            </div>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${data.latest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {variants.map((v) => (
          <div key={v.id} onClick={() => setExpanded(v.id)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s, transform 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${v.libColor}40`; e.currentTarget.style.transform = "scale(1.01)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "scale(1)"; }}>
            <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: v.libColor, fontSize: 10, fontWeight: 700, opacity: 0.5 }}>#{v.id}</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>{v.title}</span>
              </div>
              <span style={{ color: v.libColor, fontSize: 9, fontWeight: 600, background: `${v.libColor}12`, border: `1px solid ${v.libColor}25`, borderRadius: 10, padding: "2px 7px" }}>{v.lib}</span>
            </div>
            <div style={{ padding: "0 12px 4px", color: "rgba(255,255,255,0.3)", fontSize: 9, lineHeight: 1.3 }}>{v.desc}</div>
            <div style={{ height: 180, position: "relative" }}>{v.render({ points: data.points, latest: data.latest })}</div>
            <div style={{ padding: "4px 12px 6px", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 8 }}>клик для увеличения </div>
          </div>
        ))}
      </div>
      {expandedVariant && (
        <div onClick={() => setExpanded(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 1200, background: "#0d0d14", border: `1px solid ${expandedVariant.libColor}30`, borderRadius: 20, overflow: "hidden", cursor: "default", boxShadow: `0 0 80px ${expandedVariant.libColor}10` }}>
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: expandedVariant.libColor, fontSize: 14, fontWeight: 700 }}>#{expandedVariant.id}</span>
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{expandedVariant.title}</span>
                <span style={{ color: expandedVariant.libColor, fontSize: 10, fontWeight: 600, background: `${expandedVariant.libColor}12`, border: `1px solid ${expandedVariant.libColor}25`, borderRadius: 12, padding: "3px 10px" }}>{expandedVariant.lib}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <StatBadge label="Price" value={`$${data.latest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#fff" />
                <StatBadge label="High" value={`$${data.high.toFixed(2)}`} />
                <StatBadge label="Low" value={`$${data.low.toFixed(2)}`} />
                <StatBadge label="Δ" value={`${changeSign}${data.changePct.toFixed(3)}%`} color={changeColor} />
                <StatBadge label="Pts" value={`${data.pointCount}`} />
                <button onClick={() => setExpanded(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", padding: "6px 14px", cursor: "pointer", fontSize: 12, marginLeft: 8 }}></button>
              </div>
            </div>
            <div style={{ padding: "4px 20px 2px", color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{expandedVariant.desc}</div>
            <div style={{ height: 520, padding: "8px 12px 16px" }}>{expandedVariant.render({ points: data.points, latest: data.latest })}</div>
          </div>
        </div>
      )}
    </div>
  );
}

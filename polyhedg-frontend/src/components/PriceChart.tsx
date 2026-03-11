"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const WS_URL = "wss://ws-live-data.polymarket.com";

/**
 * Smooth real-time chart inspired by SmoothieCharts rendering technique:
 * - Time snapped to pixel granularity so line shifts exactly 1px per frame
 * - Bezier curves between points for smooth appearance
 * - Continuous scrolling canvas at 60fps via requestAnimationFrame
 * - Smooth Y-axis scaling with lerp
 */

// ── TimeSeries data store ──
class TimeSeries {
  data: [number, number][] = []; // [timestamp_ms, value]
  maxVal = NaN;
  minVal = NaN;

  append(ts: number, val: number) {
    if (isNaN(ts) || isNaN(val)) return;
    this.data.push([ts, val]);
    this.maxVal = isNaN(this.maxVal) ? val : Math.max(this.maxVal, val);
    this.minVal = isNaN(this.minVal) ? val : Math.min(this.minVal, val);
  }

  dropOld(cutoff: number) {
    let rm = 0;
    while (this.data.length - rm > 2 && this.data[rm + 1]![0] < cutoff) rm++;
    if (rm > 0) this.data.splice(0, rm);
  }

  resetBounds() {
    if (!this.data.length) { this.maxVal = NaN; this.minVal = NaN; return; }
    let max = -Infinity, min = Infinity;
    for (const d of this.data) { if (d[1] > max) max = d[1]; if (d[1] < min) min = d[1]; }
    this.maxVal = max; this.minVal = min;
  }
}

// ── Config ──
const MS_PER_PX = 150;       // how many ms each pixel represents (lower = faster scroll)
const SCALE_SMOOTH = 0.12;   // y-axis scale smoothing factor
const LINE_COLOR = "#8b5cf6";
const FILL_TOP = "rgba(139, 92, 246, 0.18)";
const FILL_BOT = "rgba(139, 92, 246, 0)";
const BG_COLOR = "rgba(0,0,0,0)";

export default function PriceChart({ symbol = "btc/usd" }: { symbol?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tsRef = useRef(new TimeSeries());
  const animRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef(false);
  const boundsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smooth scaling state
  const curRange = useRef(1);
  const curMinVal = useRef(0);

  const [mode, setMode] = useState<"connecting" | "live" | "simulated">("connecting");
  const [displayPrice, setDisplayPrice] = useState(0);

  // Seed history
  const seed = useCallback((base: number) => {
    const ts = tsRef.current;
    ts.data = [];
    const now = Date.now();
    let p = base, vel = 0;
    for (let i = 600; i >= 0; i--) {
      vel = vel * 0.96 + (Math.random() - 0.5) * base * 0.00008;
      vel += (base - p) * 0.001;
      p += vel;
      ts.append(now - i * MS_PER_PX, p); // one point per pixel
    }
    curRange.current = ts.maxVal - ts.minVal || 1;
    curMinVal.current = ts.minVal;
    setDisplayPrice(base);
  }, []);

  // Start simulation
  const startSim = useCallback(() => {
    if (simRef.current) return;
    setMode("simulated");
    const base = 83000 + Math.random() * 2000;
    seed(base);
    let p = base, vel = 0;
    simRef.current = setInterval(() => {
      vel = vel * 0.93 + (base - p) * 0.001 + (Math.random() - 0.5) * base * 0.00015;
      p += vel;
      tsRef.current.append(Date.now(), p);
      setDisplayPrice(p);
    }, 150);
  }, [seed]);

  // ── Render loop (SmoothieCharts-style) ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) { animRef.current = requestAnimationFrame(render); return; }

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(render); return; }

    // Resize canvas
    const cw = Math.floor(w * dpr);
    const ch = Math.floor(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── KEY TRICK from SmoothieCharts: snap time to pixel granularity ──
    // This makes the chart scroll exactly 1px at a time = buttery smooth
    let time = Date.now();
    time -= time % MS_PER_PX;

    const oldestValid = time - w * MS_PER_PX;
    const ts = tsRef.current;
    ts.dropOld(oldestValid);
    const data = ts.data;

    // Smooth Y scaling
    let chartMax = NaN, chartMin = NaN;
    if (!isNaN(ts.maxVal)) chartMax = ts.maxVal;
    if (!isNaN(ts.minVal)) chartMin = ts.minVal;
    if (!isNaN(chartMax) && !isNaN(chartMin)) {
      const pad = (chartMax - chartMin) * 0.12 || 10;
      chartMax += pad;
      chartMin -= pad;
      const targetRange = chartMax - chartMin;
      curRange.current += SCALE_SMOOTH * (targetRange - curRange.current);
      curMinVal.current += SCALE_SMOOTH * (chartMin - curMinVal.current);
    }

    // Map functions
    const valToY = (v: number) => curRange.current === 0 ? h : h * (1 - (v - curMinVal.current) / curRange.current);
    const timeToX = (t: number) => w - (time - t) / MS_PER_PX;

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) { animRef.current = requestAnimationFrame(render); return; }

    // ── Draw bezier curve (SmoothieCharts style) ──
    ctx.beginPath();
    let firstX = timeToX(data[0]![0]);
    let firstY = valToY(data[0]![1]);
    let lastX = firstX;
    let lastY = firstY;
    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < data.length; i++) {
      const x = timeToX(data[i]![0]);
      const y = valToY(data[i]![1]);
      // Bezier with control points at midpoint X, keeping Y of prev/current
      const midX = Math.round((lastX + x) / 2);
      ctx.bezierCurveTo(midX, lastY, midX, y, x, y);
      lastX = x;
      lastY = y;
    }

    // Stroke
    ctx.lineWidth = 2;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(lastX, h);
    ctx.lineTo(firstX, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, FILL_TOP);
    grad.addColorStop(1, FILL_BOT);
    ctx.fillStyle = grad;
    ctx.fill();

    // Pulsing dot at latest point
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6 + pulse * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(139, 92, 246, ${0.15 + pulse * 0.1})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = LINE_COLOR;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dashed line to right edge
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(w, lastY);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    const priceStr = (data[data.length - 1]?.[1] ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    const tm = ctx.measureText(priceStr);
    const lx = w - tm.width - 12;
    ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
    ctx.beginPath();
    ctx.roundRect(lx - 4, lastY - 10, tm.width + 8, 20, 4);
    ctx.fill();
    ctx.fillStyle = LINE_COLOR;
    ctx.textBaseline = "middle";
    ctx.fillText(priceStr, lx, lastY);

    // Time labels at bottom
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const gridMs = 15000; // 15s grid
    for (let t = time - (time % gridMs); t >= oldestValid; t -= gridMs) {
      const gx = timeToX(t);
      if (gx > 40 && gx < w - 40) {
        const d = new Date(t);
        ctx.fillText(`${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`, gx, h - 2);
        // subtle grid line
        ctx.beginPath();
        ctx.moveTo(gx, 0); ctx.lineTo(gx, h - 16);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    animRef.current = requestAnimationFrame(render);
  }, []);

  // WebSocket
  useEffect(() => {
    let fb: ReturnType<typeof setTimeout> | null = null;
    const conn = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          ws.send(JSON.stringify({ action: "subscribe", subscriptions: [{ topic: "crypto_prices_chainlink", type: "update", filters: JSON.stringify({ symbol }) }] }));
          fb = setTimeout(() => { if (!liveRef.current) startSim(); }, 5000);
        };
        ws.onmessage = (e) => {
          try {
            if (typeof e.data !== "string" || !e.data.includes("payload")) return;
            const m = JSON.parse(e.data);
            const price = parseFloat(m?.payload?.price ?? m?.payload?.value);
            if (!isNaN(price) && price > 0) {
              if (!liveRef.current) { liveRef.current = true; if (fb) { clearTimeout(fb); fb = null; } setMode("live"); seed(price); }
              tsRef.current.append(Date.now(), price);
              setDisplayPrice(price);
            }
          } catch {}
        };
        ws.onerror = () => { if (!liveRef.current && !fb) startSim(); };
        ws.onclose = () => { if (liveRef.current) setTimeout(conn, 3000); };
      } catch { startSim(); }
    };
    conn();

    // Periodically reset bounds for smooth scaling
    boundsTimer.current = setInterval(() => tsRef.current.resetBounds(), 3000);

    return () => {
      if (fb) clearTimeout(fb);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
      if (boundsTimer.current) { clearInterval(boundsTimer.current); boundsTimer.current = null; }
    };
  }, [symbol, startSim, seed]);

  // Start render loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [render]);

  const mc = mode === "live" ? "#22c55e" : mode === "simulated" ? "#f59e0b" : "#6b7280";
  const ml = mode === "live" ? "LIVE" : mode === "simulated" ? "DEMO" : "...";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 400 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{symbol.replace("/", " / ").toUpperCase()}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${mc}15`, border: `1px solid ${mc}40`, borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: mc, boxShadow: `0 0 8px ${mc}` }} />
            <span style={{ color: mc, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>{ml}</span>
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontVariantNumeric: "tabular-nums" }}>
          ${displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

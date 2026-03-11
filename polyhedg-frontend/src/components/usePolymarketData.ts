"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const WS_URL = "wss://ws-live-data.polymarket.com";

export interface PricePoint {
  t: number;
  v: number;
}

export interface PolymarketData {
  points: PricePoint[];
  latest: number;
  mode: "connecting" | "live" | "simulated";
  high: number;
  low: number;
  change: number;
  changePct: number;
  pointCount: number;
}

export function usePolymarketData(symbol = "btc/usd"): PolymarketData {
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [latest, setLatest] = useState(0);
  const [mode, setMode] = useState<"connecting" | "live" | "simulated">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef(false);
  const ptsRef = useRef<PricePoint[]>([]);
  const firstPrice = useRef(0);

  const addPoint = useCallback((v: number) => {
    const p: PricePoint = { t: Date.now(), v };
    ptsRef.current.push(p);
    if (ptsRef.current.length > 2000) ptsRef.current = ptsRef.current.slice(-2000);
    if (firstPrice.current === 0) firstPrice.current = v;
    setPoints([...ptsRef.current]);
    setLatest(v);
  }, []);

  const seed = useCallback((base: number) => {
    const now = Date.now();
    const pts: PricePoint[] = [];
    let p = base, vel = 0;
    for (let i = 300; i >= 0; i--) {
      vel = vel * 0.96 + (Math.random() - 0.5) * base * 0.00008;
      vel += (base - p) * 0.001;
      p += vel;
      pts.push({ t: now - i * 300, v: p });
    }
    ptsRef.current = pts;
    firstPrice.current = pts[0]?.v ?? base;
    setPoints([...pts]);
    setLatest(base);
  }, []);

  const startSim = useCallback(() => {
    if (simRef.current) return;
    setMode("simulated");
    const base = 83000 + Math.random() * 2000;
    seed(base);
    let p = base, vel = 0;
    simRef.current = setInterval(() => {
      vel = vel * 0.93 + (base - p) * 0.001 + (Math.random() - 0.5) * base * 0.00015;
      p += vel;
      addPoint(p);
    }, 300);
  }, [seed, addPoint]);

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
              addPoint(price);
            }
          } catch {}
        };
        ws.onerror = () => { if (!liveRef.current && !fb) startSim(); };
        ws.onclose = () => { if (liveRef.current) setTimeout(conn, 3000); };
      } catch { startSim(); }
    };
    conn();
    return () => {
      if (fb) clearTimeout(fb);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    };
  }, [symbol, startSim, seed, addPoint]);

  let high = 0, low = Infinity;
  for (const p of points) { if (p.v > high) high = p.v; if (p.v < low) low = p.v; }
  if (low === Infinity) low = 0;
  const change = latest - firstPrice.current;
  const changePct = firstPrice.current ? (change / firstPrice.current) * 100 : 0;

  return { points, latest, mode, high, low, change, changePct, pointCount: points.length };
}

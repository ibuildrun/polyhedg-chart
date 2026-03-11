"use client";
/**
 * ВАРИАНТ 1: SmoothieCharts
 * Библиотека специально для плавного стриминга real-time данных.
 * npm: smoothie
 * Ключевая фишка: непрерывный скролл canvas, bezier интерполяция,
 * время привязано к пиксельной сетке.
 */
import { useRef, useEffect } from "react";
import type { PricePoint } from "./usePolymarketData";

// Dynamic import smoothie (it's a UMD module)
let SmoothieChart: any = null;
let TimeSeries: any = null;

export default function ChartSmoothie({ points, latest }: { points: PricePoint[]; latest: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const tsRef = useRef<any>(null);
  const initRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Init smoothie
  useEffect(() => {
    let mounted = true;
    import("smoothie").then((mod) => {
      if (!mounted) return;
      SmoothieChart = mod.SmoothieChart;
      TimeSeries = mod.TimeSeries;

      if (!canvasRef.current || initRef.current) return;
      initRef.current = true;

      const ts = new TimeSeries();
      tsRef.current = ts;

      const chart = new SmoothieChart({
        millisPerPixel: 50,
        interpolation: "bezier",
        grid: {
          fillStyle: "transparent",
          strokeStyle: "rgba(255,255,255,0.05)",
          lineWidth: 1,
          millisPerLine: 10000,
          verticalSections: 4,
          borderVisible: false,
        },
        labels: {
          fillStyle: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          precision: 2,
        },
        maxValueScale: 1.05,
        minValueScale: 1.05,
        scaleSmoothing: 0.3,
        responsive: true,
        tooltip: false,
      });

      chart.addTimeSeries(ts, {
        lineWidth: 2,
        strokeStyle: "#8b5cf6",
        fillStyle: "rgba(139, 92, 246, 0.15)",
      });

      chart.streamTo(canvasRef.current, 500);
      chartRef.current = chart;

      // Seed existing points
      for (const p of points) {
        ts.append(p.t, p.v);
      }
    });

    return () => {
      mounted = false;
      if (chartRef.current) chartRef.current.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Feed new points
  useEffect(() => {
    if (!tsRef.current || points.length === 0) return;
    const last = points[points.length - 1]!;
    tsRef.current.append(last.t, last.v);
  }, [points]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

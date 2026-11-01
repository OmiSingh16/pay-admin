"use client";

import { useRef, useState } from "react";

interface DataPoint {
  date: Date;
  dep: number;
  wd: number;
}

interface LineChartProps {
  data: DataPoint[];
}

const COLORS = { dep: "#ff8a00", wd: "#0f1a2b" };

export function LineChart({ data }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 640;
  const H = 230;
  const P = { l: 42, r: 8, t: 10, b: 24 };
  
  const max = Math.max(...data.flatMap((d) => [d.dep, d.wd])) * 1.1 || 1;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (data.length - 1);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);

  const path = (key: "dep" | "wd") =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join("");

  const short = (n: number) => n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? Math.round(n / 1000) + "k" : n.toString();
  const dlabel = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const handleMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const vx = (cx / rect.width) * W;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((vx - P.l) / ((W - P.l - P.r) / (data.length - 1)))));
    
    const px = x(idx);
    const py = y(data[idx].dep);
    
    setHover({
      x: (px / W) * rect.width,
      y: py,
      idx,
    });
  };

  return (
    <div className="relative touch-pan-y" onPointerMove={handleMove} onPointerLeave={() => setHover(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block overflow-visible">
        {/* Grid & Y-axis labels */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="#dde2ea" />
            <text x={P.l - 8} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="#66748a">{short(max * f)}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const step = Math.ceil(data.length / 6);
          if (i % step !== 0) return null;
          return <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize="11" fill="#66748a">{dlabel(d.date)}</text>;
        })}

        {/* Area for Deposits */}
        <path d={`${path("dep")}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="#ff8a0022" />
        
        {/* Lines */}
        <path d={path("dep")} fill="none" stroke={COLORS.dep} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path("wd")} fill="none" stroke={COLORS.wd} strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />

        {/* Crosshair */}
        {hover && (
          <>
            <line x1={x(hover.idx)} x2={x(hover.idx)} y1={P.t} y2={H - P.b} stroke="#0f1a2b" strokeOpacity=".25" />
            <circle cx={x(hover.idx)} cy={y(data[hover.idx].dep)} r="5" fill={COLORS.dep} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div 
          className="absolute top-0 pointer-events-none bg-[var(--navy)] text-white rounded-xl px-3 py-2 text-[13px] whitespace-nowrap -translate-x-1/2"
          style={{ left: `${hover.x}px` }}
        >
          <b>{dlabel(data[hover.idx].date)}</b>
          <br />
          In ₹{data[hover.idx].dep.toLocaleString("en-IN")} · Out ₹{data[hover.idx].wd.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
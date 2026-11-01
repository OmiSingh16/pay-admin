interface SparklineProps {
  data: number[]; // Array of amounts
}

export function Sparkline({ data }: SparklineProps) {
  const B = data.length || 12;
  const max = Math.max(...data, 1);
  
  // Fill empty data if less than B
  const filled = Array.from({ length: B }, (_, i) => data[i] || 0);
  
  const pts = filled.map((v, i) => `${(i / (B - 1)) * 300},${58 - (v / max) * 50}`);
  
  return (
    <svg className="w-full h-16" viewBox="0 0 300 64" preserveAspectRatio="none">
      <polygon points={`0,64 ${pts.join(" ")} 300,64`} fill="#ff8a0030" />
      <polyline 
        points={pts.join(" ")} 
        fill="none" 
        stroke="#ff8a00" 
        strokeWidth="2.5" 
        vectorEffect="non-scaling-stroke" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
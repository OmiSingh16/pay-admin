interface HeatmapData {
  dow: number; // 1-7 (Mon-Sun)
  hr: number;  // 0-23
  count: number;
}

export function Heatmap({ data }: { data: HeatmapData[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...data.map((d) => d.count), 1);

  const getIntensity = (dow: number, hr: number) => {
    const found = data.find((d) => d.dow === dow && d.hr === hr);
    if (!found) return 0.08;
    return 0.08 + (found.count / max) * 0.92;
  };

  return (
    <div className="grid grid-cols-[34px_repeat(24,1fr)] gap-[3px] items-center text-[11px] text-[var(--ink-2)]">
      {days.map((day, r) => (
        <div key={day} className="contents">
          <span>{day}</span>
          {Array.from({ length: 24 }).map((_, c) => (
            <i
              key={c}
              className="aspect-square rounded-[4px] bg-[var(--saffron)]"
              style={{ opacity: getIntensity(r + 1, c) }}
              title={`${day} ${c}:00`}
            />
          ))}
        </div>
      ))}
      <span className="col-span-full flex justify-between mt-1">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </span>
    </div>
  );
}
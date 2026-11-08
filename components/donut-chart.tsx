"use client";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  slices,
  size = 140,
  formatValue = (v) => String(v),
}: {
  slices: DonutSlice[];
  size?: number;
  formatValue?: (value: number) => string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const visible = slices.filter((s) => s.value > 0);

  if (total <= 0) {
    return <p className="text-sm text-muted-foreground">אין נתונים עדיין</p>;
  }

  let cursor = 0;
  const stops = visible
    .map((s) => {
      const start = (cursor / total) * 360;
      cursor += s.value;
      const end = (cursor / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-5">
      <div
        role="img"
        aria-label={visible.map((s) => `${s.label}: ${s.value}`).join(", ")}
        className="relative shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops})`,
        }}
      >
        <div
          className="absolute rounded-full bg-background"
          style={{
            inset: size * 0.28,
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        {visible.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatValue(s.value)} ({Math.round((s.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

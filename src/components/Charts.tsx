"use client";
export function BarChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map(d=>d.value));
  return (
    <div role="img" aria-label={label} className="space-y-2">
      {data.map(d=> (
        <div key={d.name} className="flex items-center gap-2 text-xs">
          <span className="w-24 truncate text-ink-500">{d.name}</span>
          <div className="flex-1 h-3 bg-ink-100 rounded overflow-hidden" aria-hidden>
            <div className="h-full bg-brass-500" style={{ width: `${(d.value/max)*100}%` }} />
          </div>
          <span className="w-10 text-right font-mono text-ink-700">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

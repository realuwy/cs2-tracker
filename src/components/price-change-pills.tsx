export function PriceChangePills({ d1h, d24h, d30d }: { d1h?: number; d24h?: number; d30d?: number }) {
  return (
    <div className="flex items-center gap-2">
      <ChangePill label="1h" v={d1h} />
      <ChangePill label="24h" v={d24h} />
      <ChangePill label="30d" v={d30d} />
    </div>
  );
}

function ChangePill({ label, v }: { label: string; v?: number }) {
  const sign = (v ?? 0) >= 0 ? "+" : "";
  const color = v == null ? "text-neutral-400" : (v >= 0 ? "text-emerald-400" : "text-red-400");
  return (
    <span className={`text-xs ${color}`}>{label}: {v == null ? "n/a" : `${sign}${v.toFixed(1)}%`}</span>
  );
}

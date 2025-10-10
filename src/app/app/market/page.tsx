"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table";
import { PriceChangePills } from "@/components/price-change-pills";
import { Item } from "@/lib/types";

export default function MarketPage() {
  const [data, setData] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/prices/skinport", { cache: "no-store" });
        const items: Item[] = await res.json();
        if (!res.ok) throw new Error((items as any)?.error || "Failed to load prices");
        if (!cancelled) setData(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const columns = useMemo<ColumnDef<Item>[]>(() => [
    {
      header: "Item",
      accessorKey: "name",
      cell: info => (
        <div className="flex items-center gap-3">
          {/* icon may be placeholder for now */}
          <img src={info.row.original.icon} alt="" width={40} height={40} className="rounded-md" />
          <div>
            <div className="font-medium">{info.getValue<string>()}</div>
            <div className="text-xs text-neutral-400">{info.row.original.exterior}</div>
          </div>
        </div>
      ),
    },
    { header: "Qty", accessorKey: "qty", cell: i => i.getValue<number>() ?? 0 },
    {
      header: "Median (AUD)",
      accessorKey: "priceMedian",
      cell: i => (i.getValue<number>() != null ? `$${i.getValue<number>()!.toFixed(2)}` : "—"),
    },
    {
      header: "Min (AUD)",
      accessorKey: "priceMin",
      cell: i => (i.getValue<number>() != null ? `$${i.getValue<number>()!.toFixed(2)}` : "—"),
    },
    {
      header: "Change",
      cell: ({ row }) => (
        <PriceChangePills
          d1h={row.original.delta1h ?? 0}
          d24h={row.original.delta24h ?? 0}
          d30d={row.original.delta30d ?? 0}
        />
      ),
    },
  ], []);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (loading) return <div className="text-neutral-300">Loading live prices…</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-neutral-400">Data source: Skinport (AUD), auto-refreshed every ~5 min.</div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="text-left px-4 py-3 font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="px-4 py-3">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

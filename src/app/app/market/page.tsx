"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table";
import { PriceChangePills } from "@/components/price-change-pills";
import { Item } from "@/lib/types";
import { fetchMarketItems } from "@/lib/mock-data"; // placeholder until wired to Skinport

export default function MarketPage() {
  const [data, setData] = useState<Item[]>([]);

  useEffect(() => {
    // demo data load
    fetchMarketItems().then(setData);
  }, []);

  const columns = useMemo<ColumnDef<Item>[]>(() => [
    {
      header: "Item",
      accessorKey: "name",
      cell: info => (
        <div className="flex items-center gap-3">
          <img src={info.row.original.icon} alt="" width={40} height={40} className="rounded" />
          <div>
            <div className="text-sm font-medium">{info.getValue() as string}</div>
            <div className="text-xs text-neutral-400">{info.row.original.exterior}</div>
          </div>
        </div>
      )
    },
    { header: "Qty", accessorKey: "qty" },
    { header: "Price (median)", accessorKey: "priceMedian", cell: i => `$${(i.getValue<number>() ?? 0).toFixed(2)}` },
    { header: "Price (min)", accessorKey: "priceMin", cell: i => `$${(i.getValue<number>() ?? 0).toFixed(2)}` },
    { header: "Last sale", accessorKey: "lastSale", cell: i => `$${(i.getValue<number>() ?? 0).toFixed(2)}` },
    { header: "Change", cell: info => <PriceChangePills d1h={info.row.original.delta1h} d24h={info.row.original.delta24h} d30d={info.row.original.delta30d} /> },
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Market (demo data)</h1>
      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/40">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-3 py-2 text-left">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="border-t border-neutral-900 hover:bg-neutral-900/30">
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="px-3 py-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">This table uses mock data. We’ll wire Skinport next.</p>
    </div>
  );
}

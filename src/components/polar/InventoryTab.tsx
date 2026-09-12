import { Meter, Panel, StatusBadge } from "@/components/polar/hud";
import { fmtUtc, stockStatus, type PolarStore } from "@/lib/polar/store";
import type { CargoItem, StockStatus } from "@/lib/polar/types";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  PackageSearch,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

const STOCK_TONE: Record<StockStatus, "alert" | "warn" | "sync" | "ice"> = {
  DEPLETED: "alert",
  CRITICAL: "alert",
  OPTIMAL: "ice",
  SURPLUS: "sync",
};

export function InventoryTab({ store }: { store: PolarStore }) {
  const { state, logCargo } = store;
  const [itemId, setItemId] = useState(state.cargo[0]?.id ?? "");
  const [kind, setKind] = useState<"INCOMING" | "OUTGOING">("OUTGOING");
  const [qty, setQty] = useState("5");
  const [note, setNote] = useState("");

  const item = state.cargo.find((c) => c.id === itemId);
  const qtyNum = Math.max(0, Math.round(Number(qty) || 0));
  const selected = item
    ? Math.max(0, Math.min(item.capacity, item.stock + (kind === "INCOMING" ? qtyNum : -qtyNum)))
    : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || qtyNum <= 0) return;
    logCargo(item.id, kind, qtyNum, note.trim());
    setNote("");
    setQty("5");
  }

  const alerts = state.cargo.filter((c) => {
    const st = stockStatus(c);
    return st === "CRITICAL" || st === "DEPLETED";
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      {/* Supply grid */}
      <Panel
        title="Supply Chain Node · Stock Levels"
        actions={
          <StatusBadge tone={alerts.length > 0 ? "warn" : "sync"}>
            {alerts.length > 0 ? `${alerts.length} THRESHOLD FLAGS` : "ALL NOMINAL"}
          </StatusBadge>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#48cae4]/12 text-left">
                <th className="hud-label px-4 py-2.5 font-medium">Commodity</th>
                <th className="hud-label px-3 py-2.5 font-medium">Status</th>
                <th className="hud-label px-3 py-2.5 font-medium">Stock / Cap</th>
                <th className="hud-label hidden px-3 py-2.5 font-medium sm:table-cell">Level</th>
                <th className="hud-label hidden px-4 py-2.5 text-right font-medium md:table-cell">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {state.cargo.map((c) => {
                const st = stockStatus(c);
                const fill = (c.stock / c.capacity) * 100;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-[#48cae4]/8 transition-colors hover:bg-[#48cae4]/5",
                      itemId === c.id && "bg-[#48cae4]/8",
                      (st === "CRITICAL" || st === "DEPLETED") && "bg-[#ff4d4d]/5",
                    )}
                    onClick={() => setItemId(c.id)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="hud-mono text-[12.5px] font-semibold text-[#d7f4ff]">{c.name}</div>
                      <div className="hud-mono text-[10px] text-[#9ec8dc]/70">{c.category}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={STOCK_TONE[st]} pulse={st === "DEPLETED"}>
                        {st}
                      </StatusBadge>
                    </td>
                    <td className="hud-mono px-3 py-2.5 text-[12px] tabular-nums text-[#d7f4ff]">
                      {c.stock}{" "}
                      <span className="text-[#9ec8dc]/60">/ {c.capacity} {c.unit}</span>
                      <div className="hud-mono text-[9px] text-[#9ec8dc]/60">MIN {c.threshold}</div>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <div className="w-28">
                        <Meter value={fill} tone={STOCK_TONE[st]} dense />
                      </div>
                    </td>
                    <td className="hud-mono hidden px-4 py-2.5 text-right text-[10px] text-[#9ec8dc]/70 md:table-cell">
                      {fmtUtc(c.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Right rail: form + ledger */}
      <div className="space-y-4">
        <Panel title="Log Cargo Movement">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="hud-label mb-1 block" htmlFor="cargo-item">Commodity</label>
              <select
                id="cargo-item"
                className="hud-input"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                {state.cargo.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0b132b]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["INCOMING", "OUTGOING"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "hud-mono flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[10px] font-bold tracking-[0.14em] transition-colors",
                    kind === k
                      ? k === "INCOMING"
                        ? "border-[#00f5d4]/50 bg-[#00f5d4]/12 text-[#00f5d4]"
                        : "border-[#ffb703]/50 bg-[#ffb703]/12 text-[#ffd166]"
                      : "border-[#48cae4]/20 bg-white/3 text-[#9ec8dc] hover:bg-white/8",
                  )}
                >
                  {k === "INCOMING" ? (
                    <ArrowDownToLine className="size-3.5" />
                  ) : (
                    <ArrowUpFromLine className="size-3.5" />
                  )}
                  {k}
                </button>
              ))}
            </div>

            <div>
              <label className="hud-label mb-1 block" htmlFor="cargo-qty">
                Quantity ({item?.unit ?? "units"})
              </label>
              <input
                id="cargo-qty"
                className="hud-input"
                type="number"
                min={1}
                max={item?.capacity ?? 999}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div>
              <label className="hud-label mb-1 block" htmlFor="cargo-note">Field note</label>
              <input
                id="cargo-note"
                className="hud-input"
                placeholder="e.g. Convoy resupply — manifest 22-B"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {item && (
              <div className="hud-panel flex items-center justify-between px-3 py-2">
                <div>
                  <div className="hud-label">Resulting stock</div>
                  <div className="hud-mono text-[13px] font-bold text-[#d7f4ff] tabular-nums">
                    {selected} / {item.capacity} {item.unit}
                  </div>
                </div>
                <StatusBadge tone={STOCK_TONE[stockStatus({ ...item, stock: selected })]}>
                  {stockStatus({ ...item, stock: selected })}
                </StatusBadge>
              </div>
            )}

            <button
              type="submit"
              disabled={!item || qtyNum <= 0}
              className="hud-mono w-full rounded-md border border-[#48cae4]/50 bg-[#48cae4]/15 px-3 py-2.5 text-[11px] font-bold tracking-[0.18em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ClipboardList className="mr-1.5 inline size-4" />
              COMMIT ENTRY
            </button>
            <p className="hud-mono text-[9px] leading-relaxed text-[#9ec8dc]/60">
              Optimistic write · {state.networkMode === "offline" ? "queued in LOCAL STORE until link restores" : "sync engine streaming to HQ"}
            </p>
          </form>
        </Panel>

        <Panel
          title="Movement Ledger"
          actions={
            <StatusBadge tone="muted">
              <Boxes className="size-3" /> LAST 40
            </StatusBadge>
          }
          bodyClassName="p-0"
        >
          {state.cargoLog.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <PackageSearch className="size-6 text-[#48cae4]/50" />
              <p className="hud-mono text-[10px] tracking-[0.14em] text-[#9ec8dc]/70">
                NO MOVEMENTS LOGGED THIS SESSION
              </p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-[#48cae4]/8 overflow-y-auto">
              {state.cargoLog.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded border",
                      e.kind === "INCOMING"
                        ? "border-[#00f5d4]/35 bg-[#00f5d4]/10 text-[#00f5d4]"
                        : "border-[#ffb703]/35 bg-[#ffb703]/10 text-[#ffd166]",
                    )}
                  >
                    {e.kind === "INCOMING" ? (
                      <ArrowDownToLine className="size-3" />
                    ) : (
                      <ArrowUpFromLine className="size-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="hud-mono truncate text-[11.5px] font-semibold text-[#d7f4ff]">
                      {e.kind === "INCOMING" ? "+" : "−"}
                      {e.qty} {e.itemName}
                    </div>
                    <div className="hud-mono truncate text-[9.5px] text-[#9ec8dc]/70">
                      {fmtUtc(e.at)}Z {e.note ? `· ${e.note}` : ""}
                    </div>
                  </div>
                  {e.synced ? (
                    <StatusBadge tone="sync">SYNCED</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn" pulse>
                      <TriangleAlert className="size-3" /> QUEUED
                    </StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

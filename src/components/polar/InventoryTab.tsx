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
        title="Supply chain node · stock levels"
        actions={
          <StatusBadge tone={alerts.length > 0 ? "warn" : "sync"}>
            {alerts.length > 0 ? `${alerts.length} threshold flags` : "All nominal"}
          </StatusBadge>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--fm-line-soft)] text-left">
                <th className="fm-label px-4 py-2.5 font-medium">Commodity</th>
                <th className="fm-label px-3 py-2.5 font-medium">Status</th>
                <th className="fm-label px-3 py-2.5 font-medium">Stock / Cap</th>
                <th className="fm-label hidden px-3 py-2.5 font-medium sm:table-cell">Level</th>
                <th className="fm-label hidden px-4 py-2.5 text-right font-medium md:table-cell">
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
                      "border-b border-[var(--fm-line-soft)] transition-colors hover:bg-[rgba(127,180,201,0.05)]",
                      itemId === c.id && "bg-[rgba(127,180,201,0.07)]",
                      (st === "CRITICAL" || st === "DEPLETED") && "bg-[rgba(208,92,75,0.05)]",
                    )}
                    onClick={() => setItemId(c.id)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="fm-mono text-[12.5px] font-semibold text-[var(--fm-ink)]">{c.name}</div>
                      <div className="fm-mono text-[10px] text-[var(--fm-mut)]">{c.category}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={STOCK_TONE[st]} pulse={st === "DEPLETED"}>
                        {st}
                      </StatusBadge>
                    </td>
                    <td className="fm-mono px-3 py-2.5 text-[12px] tabular-nums text-[var(--fm-ink)]">
                      {c.stock}{" "}
                      <span className="text-[var(--fm-mut)]">/ {c.capacity} {c.unit}</span>
                      <div className="fm-mono text-[9px] text-[var(--fm-mut)]">MIN {c.threshold}</div>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <div className="w-28">
                        <Meter value={fill} tone={STOCK_TONE[st]} dense />
                      </div>
                    </td>
                    <td className="fm-mono hidden px-4 py-2.5 text-right text-[10px] text-[var(--fm-mut)] md:table-cell">
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
        <Panel title="Log cargo movement">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="fm-label-field" htmlFor="cargo-item">Commodity</label>
              <select
                id="cargo-item"
                className="fm-input fm-mono text-[13px]"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                {state.cargo.map((c) => (
                  <option key={c.id} value={c.id}>
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
                    "fm-mono flex items-center justify-center gap-1.5 rounded-sm border px-2 py-2 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
                    kind === k
                      ? k === "INCOMING"
                        ? "border-[rgba(127,174,142,0.5)] bg-[rgba(127,174,142,0.1)] text-[var(--fm-good)]"
                        : "border-[rgba(201,163,79,0.5)] bg-[rgba(201,163,79,0.1)] text-[var(--fm-warn)]"
                      : "border-[var(--fm-line)] text-[var(--fm-mut)] hover:text-[var(--fm-ink)]",
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
              <label className="fm-label-field" htmlFor="cargo-qty">
                Quantity ({item?.unit ?? "units"})
              </label>
              <input
                id="cargo-qty"
                className="fm-input fm-mono text-[13px]"
                type="number"
                min={1}
                max={item?.capacity ?? 999}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div>
              <label className="fm-label-field" htmlFor="cargo-note">Field note</label>
              <input
                id="cargo-note"
                className="fm-input"
                placeholder="e.g. Convoy resupply — manifest 22-B"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {item && (
              <div className="fm-panel-2 flex items-center justify-between px-3 py-2">
                <div>
                  <div className="fm-label">Resulting stock</div>
                  <div className="fm-mono text-[13px] font-bold text-[var(--fm-ink)] tabular-nums">
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
              className="fm-btn fm-btn fm-btn-solid w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ClipboardList className="size-3.5" />
              Commit entry
            </button>
            <p className="fm-mono text-[9px] leading-relaxed text-[var(--fm-mut)] uppercase">
              Optimistic write · {store.link === "down" ? "uplink down — queued in local store until it restores" : store.link === "lowband" ? "low bandwidth — queue drains slowly to HQ" : "sync engine streaming to expedition HQ"}
            </p>
          </form>
        </Panel>

        <Panel
          title="Movement ledger"
          actions={
            <StatusBadge tone="muted">
              <Boxes className="size-3" /> Last 40
            </StatusBadge>
          }
          bodyClassName="p-0"
        >
          {state.cargoLog.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <PackageSearch className="size-6 text-[var(--fm-accent-deep)]" />
              <p className="fm-mono text-[10px] tracking-[0.14em] text-[var(--fm-mut)] uppercase">
                No movements logged this session
              </p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-[var(--fm-line-soft)] overflow-y-auto">
              {state.cargoLog.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span
                    className={cn(
                      "fm-plate grid size-6 shrink-0 place-items-center",
                      e.kind === "INCOMING"
                        ? "border-[rgba(127,174,142,0.4)] text-[var(--fm-good)]"
                        : "border-[rgba(201,163,79,0.4)] text-[var(--fm-warn)]",
                    )}
                  >
                    {e.kind === "INCOMING" ? (
                      <ArrowDownToLine className="size-3" />
                    ) : (
                      <ArrowUpFromLine className="size-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="fm-mono truncate text-[11.5px] font-semibold text-[var(--fm-ink)]">
                      {e.kind === "INCOMING" ? "+" : "−"}
                      {e.qty} {e.itemName}
                    </div>
                    <div className="fm-mono truncate text-[9.5px] text-[var(--fm-mut)]">
                      {fmtUtc(e.at)}Z {e.note ? `· ${e.note}` : ""}
                    </div>
                  </div>
                  {e.synced ? (
                    <StatusBadge tone="sync">Synced</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn" pulse>
                      <TriangleAlert className="size-3" /> Queued
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

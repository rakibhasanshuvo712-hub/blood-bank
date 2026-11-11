"use client";

import React, { useState } from "react";
import {
  Droplet,
  Plus,
  Minus,
  SlidersHorizontal,
  History,
  AlertTriangle,
} from "lucide-react";
import { BLOOD_GROUPS, BloodGroup } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import { BloodGroupBadge, StockStatusBadge } from "@/components/ui/Badges";
import { StockAdjustModal } from "@/components/inventory/StockAdjustModal";
import { cn, formatDateTime, getStockStatus } from "@/lib/utils";

export default function InventoryPage() {
  const { stock, stockLogs, adjustStock, summary } = useBloodBank();

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>("O+");
  const [logGroupFilter, setLogGroupFilter] = useState<BloodGroup | "ALL">(
    "ALL"
  );

  const openBatchAdjust = (bg: BloodGroup) => {
    setSelectedGroup(bg);
    setAdjustModalOpen(true);
  };

  const filteredLogs =
    logGroupFilter === "ALL"
      ? stockLogs
      : stockLogs.filter((l) => l.bloodGroup === logGroupFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Blood Stock Inventory
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {summary.totalUnits} total blood bag units • Thresholds: Sufficient
            (≥ 6), Low Stock (3–5), Critical (&lt; 3).
          </p>
        </div>

        <button
          type="button"
          onClick={() => openBatchAdjust("O+")}
          className="inline-flex items-center gap-2 rounded-xl bg-crimson-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 shadow-sm transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Batch Adjust Stock
        </button>
      </div>

      {/* Critical Warning */}
      {summary.criticalGroups.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>
            <strong>Critical Reserve Warning:</strong>{" "}
            {summary.criticalGroups.join(", ")} currently have fewer than 3
            units available.
          </span>
        </div>
      )}

      {/* 8 Blood Group Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BLOOD_GROUPS.map((bg) => {
          const units = stock[bg] ?? 0;
          const status = getStockStatus(units);
          const isCritical = status === "Critical";
          const pct = Math.min(100, Math.round((units / 20) * 100));

          return (
            <div
              key={bg}
              className={cn(
                "rounded-2xl border bg-white p-5 shadow-soft flex flex-col justify-between transition-all",
                isCritical
                  ? "border-red-300 ring-1 ring-red-200"
                  : "border-slate-200"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-sm",
                        isCritical
                          ? "bg-red-600 text-white"
                          : "bg-crimson-50 text-crimson-700 border border-crimson-200"
                      )}
                    >
                      {bg}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Blood Group
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {units} unit{units === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <StockStatusBadge status={status} />
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        status === "Sufficient"
                          ? "bg-emerald-500"
                          : status === "Low Stock"
                            ? "bg-amber-500"
                            : "bg-red-600"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={units <= 0}
                    onClick={() =>
                      adjustStock(
                        bg,
                        -1,
                        `Quick issuance (-1 unit ${bg}) from Inventory`,
                        "issuance"
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Remove 1 unit of ${bg}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      adjustStock(
                        bg,
                        1,
                        `Quick intake (+1 unit ${bg}) from Inventory`,
                        "addition"
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-crimson-600 text-white hover:bg-crimson-700"
                    aria-label={`Add 1 unit of ${bg}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openBatchAdjust(bg)}
                  className="text-xs font-semibold text-slate-600 hover:text-crimson-600 transition-colors flex items-center gap-1"
                >
                  <Droplet className="h-3.5 w-3.5" />
                  Batch Log
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Movement Audit History */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-crimson-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Stock Additions & Issuances History
            </h3>
          </div>

          <select
            value={logGroupFilter}
            onChange={(e) =>
              setLogGroupFilter(e.target.value as BloodGroup | "ALL")
            }
            aria-label="Filter stock history by blood group"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-crimson-500 focus:outline-none"
          >
            <option value="ALL">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Reason / Reference</th>
                <th className="px-5 py-3">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No stock movement entries found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <BloodGroupBadge group={log.bloodGroup} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 font-bold",
                          log.change > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {log.change > 0 ? `+${log.change}` : log.change} unit
                        {Math.abs(log.change) > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {log.previousUnits} → <strong>{log.newUnits}</strong>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-md">
                      {log.reason}
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {log.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <StockAdjustModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        defaultGroup={selectedGroup}
      />
    </div>
  );
}

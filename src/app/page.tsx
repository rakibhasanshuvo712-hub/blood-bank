"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Droplet,
  ClipboardList,
  AlertTriangle,
  Plus,
  Minus,
  ArrowRight,
  Activity,
  UserPlus,
  FilePlus2,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { BLOOD_GROUPS, BloodRequest } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import {
  BloodGroupBadge,
  RequestStatusBadge,
  StockStatusBadge,
  UrgencyBadge,
} from "@/components/ui/Badges";
import { DonorModal } from "@/components/donors/DonorModal";
import { RequestModal } from "@/components/requests/RequestModal";
import { RequestDetailsModal } from "@/components/requests/RequestDetailsModal";
import {
  cn,
  formatDateShort,
  formatDateTime,
  getStockStatus,
  resolveDonorAvailability,
} from "@/lib/utils";

export default function DashboardPage() {
  const { summary, stock, donors, requests, stockLogs, adjustStock } =
    useBloodBank();

  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(
    null
  );

  const pendingUrgentRequests = useMemo(
    () =>
      requests
        .filter((r) => r.status === "Pending")
        .sort((a, b) => {
          const rank = { Emergency: 0, Urgent: 1, Normal: 2 };
          return rank[a.urgency] - rank[b.urgency];
        })
        .slice(0, 5),
    [requests]
  );

  const recentLogs = stockLogs.slice(0, 5);

  const donorReadinessPct =
    summary.totalDonors > 0
      ? Math.round((summary.availableDonors / summary.totalDonors) * 100)
      : 0;

  const donorCountsByGroup = useMemo(() => {
    return BLOOD_GROUPS.map((bg) => {
      const total = donors.filter((d) => d.bloodGroup === bg).length;
      const available = donors.filter(
        (d) => d.bloodGroup === bg && resolveDonorAvailability(d)
      ).length;
      return { bg, total, available };
    });
  }, [donors]);

  return (
    <div className="space-y-6">
      {/* Attractive Medical Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-crimson-950 to-crimson-800 p-6 sm:p-7 text-white shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-crimson-500/20 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-crimson-100">
              <HeartPulse className="h-3.5 w-3.5 text-crimson-300" />
              Live Blood Bank Command Center
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
              Operations & Stock Readiness
            </h2>
            <p className="mt-1.5 text-sm text-slate-200/90 max-w-2xl">
              {donorReadinessPct}% of registered donors are currently eligible
              under the 90-day medical rule, with{" "}
              <span className="font-semibold text-white">
                {summary.totalUnits} blood units
              </span>{" "}
              across 8 ABO/Rh groups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setDonorModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
            >
              <UserPlus className="h-4 w-4 text-crimson-200" />
              Register Donor
            </button>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-crimson-700 hover:bg-crimson-50 shadow-sm transition-colors"
            >
              <FilePlus2 className="h-4 w-4" />
              New Blood Request
            </button>
          </div>
        </div>
      </div>

      {/* Emergency / Critical Stock Alert Banner */}
      {summary.criticalGroups.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-gradient-to-r from-red-50 via-crimson-50 to-white p-4 shadow-soft flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                Critical Stock Alert — Immediate Replenishment Needed
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                Blood group(s) below the 3-unit safety threshold:{" "}
                <strong className="font-bold">
                  {summary.criticalGroups
                    .map(
                      (bg) =>
                        `${bg} (${stock[bg]} unit${stock[bg] === 1 ? "" : "s"})`
                    )
                    .join(" • ")}
                </strong>
              </p>
            </div>
          </div>
          <Link
            href="/donors"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            Contact Eligible Donors
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Registered Donors
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson-50 text-crimson-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.totalDonors}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">
              {summary.availableDonors} available
            </span>{" "}
            ({donorReadinessPct}% ready)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Blood Units
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Droplet className="h-5 w-5 fill-red-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.totalUnits}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across all 8 ABO/Rh blood groups
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Requests
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.pendingRequests}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {
              requests.filter(
                (r) => r.status === "Pending" && r.urgency === "Emergency"
              ).length
            }{" "}
            marked as Emergency
          </p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-5 shadow-soft hover:shadow-md transition-shadow",
            summary.criticalGroups.length > 0
              ? "border-red-200 bg-red-50/60"
              : "border-emerald-200 bg-emerald-50/50"
          )}
        >
          <div className="flex items-center justify-between">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                summary.criticalGroups.length > 0
                  ? "text-red-700"
                  : "text-emerald-700"
              )}
            >
              Critical Stock Alerts
            </p>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                summary.criticalGroups.length > 0
                  ? "bg-red-600 text-white"
                  : "bg-emerald-600 text-white"
              )}
            >
              {summary.criticalGroups.length > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
          </div>
          <p
            className={cn(
              "mt-3 text-3xl font-bold",
              summary.criticalGroups.length > 0
                ? "text-red-700"
                : "text-emerald-800"
            )}
          >
            {summary.criticalGroups.length}
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              summary.criticalGroups.length > 0
                ? "text-red-700"
                : "text-emerald-700"
            )}
          >
            {summary.criticalGroups.length > 0
              ? `Groups < 3 units: ${summary.criticalGroups.join(", ")}`
              : "All blood groups safely stocked"}
          </p>
        </div>
      </div>

      {/* Visual Blood Stock Grid (8 Blood Groups with Quick +/- & Fill Gauge) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live Blood Stock Availability
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Use quick +/- controls to adjust blood bag units directly. Groups
              below 3 units are highlighted in red.
            </p>
          </div>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-600 hover:text-crimson-700"
          >
            Full Inventory & Audit Log
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {BLOOD_GROUPS.map((bg) => {
            const units = stock[bg] ?? 0;
            const status = getStockStatus(units);
            const isCritical = status === "Critical";
            const isLow = status === "Low Stock";
            const gaugePct = Math.min(100, Math.round((units / 18) * 100));

            return (
              <div
                key={bg}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isCritical
                    ? "border-red-300 bg-gradient-to-b from-red-50/90 to-white ring-1 ring-red-200"
                    : isLow
                      ? "border-amber-200 bg-gradient-to-b from-amber-50/60 to-white"
                      : "border-slate-200 bg-gradient-to-b from-slate-50/70 to-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-lg font-extrabold tracking-tight",
                      isCritical ? "text-red-700" : "text-crimson-700"
                    )}
                  >
                    {bg}
                  </span>
                  <Droplet
                    className={cn(
                      "h-4 w-4",
                      isCritical
                        ? "text-red-600 fill-red-600"
                        : "text-crimson-500 fill-crimson-500"
                    )}
                  />
                </div>

                <div className="my-3">
                  <p
                    className={cn(
                      "text-3xl font-black leading-none",
                      isCritical ? "text-red-700" : "text-slate-900"
                    )}
                  >
                    {units}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    unit{units === 1 ? "" : "s"} in bank
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isCritical
                          ? "bg-red-600"
                          : isLow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.max(8, gaugePct)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <StockStatusBadge status={status} />

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        adjustStock(
                          bg,
                          -1,
                          `Quick issuance (-1 unit ${bg}) from Dashboard`,
                          "issuance"
                        )
                      }
                      disabled={units <= 0}
                      aria-label={`Decrease ${bg} stock`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        adjustStock(
                          bg,
                          1,
                          `Quick intake (+1 unit ${bg}) from Dashboard`,
                          "addition"
                        )
                      }
                      aria-label={`Increase ${bg} stock`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-crimson-600 py-1.5 text-white hover:bg-crimson-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Two Columns: Pending Blood Requests + Donor Availability & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Blood Requests */}
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Priority Pending Blood Requests
              </h3>
              <p className="text-xs text-slate-500">
                Click any request to inspect stock, match donors, or issue blood.
              </p>
            </div>
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-600 hover:text-crimson-700"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingUrgentRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              All blood requests have been processed.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingUrgentRequests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    "w-full text-left flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:border-crimson-300 hover:bg-crimson-50/30 transition-all",
                    req.urgency === "Emergency"
                      ? "border-red-200 bg-red-50/40"
                      : "border-slate-200 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BloodGroupBadge group={req.bloodGroup} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {req.patientName}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({req.unitsNeeded} unit{req.unitsNeeded > 1 ? "s" : ""})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {req.hospital} • {formatDateShort(req.requestDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={req.urgency} />
                    <RequestStatusBadge status={req.status} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Donor Availability Coverage Strip */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Available Donors by Blood Group
              </h4>
              <Link
                href="/donors"
                className="text-xs font-semibold text-crimson-600 hover:underline"
              >
                Open Registry
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {donorCountsByGroup.map(({ bg, available, total }) => (
                <div
                  key={bg}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2 text-center"
                >
                  <p className="text-xs font-bold text-crimson-700">{bg}</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {available}
                    <span className="text-[10px] font-normal text-slate-400">
                      /{total}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Stock Activity Log */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-crimson-600" />
              <h3 className="text-base font-bold text-slate-900">
                Recent Stock Movements
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-crimson-600 hover:text-crimson-700"
            >
              History
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-7 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    log.change > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {log.change > 0 ? `+${log.change}` : log.change}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Group {log.bloodGroup} ({log.previousUnits} →{" "}
                      {log.newUnits})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {log.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      <DonorModal
        isOpen={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
      />
      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
      <RequestDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

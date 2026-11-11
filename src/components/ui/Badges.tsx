"use client";

import React from "react";
import {
  BloodGroup,
  RequestStatus,
  StockStatus,
  UrgencyLevel,
} from "@/types";
import { cn } from "@/lib/utils";

export function BloodGroupBadge({
  group,
  size = "md",
}: {
  group: BloodGroup;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
        ? "px-3 py-1 text-sm"
        : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tracking-tight bg-crimson-50 text-crimson-700 border border-crimson-200",
        sizeClass
      )}
    >
      {group}
    </span>
  );
}

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const styles: Record<StockStatus, string> = {
    Sufficient: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Low Stock": "bg-amber-50 text-amber-700 border-amber-200",
    Critical: "bg-red-50 text-red-700 border-red-200 animate-pulse",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Sufficient"
            ? "bg-emerald-500"
            : status === "Low Stock"
              ? "bg-amber-500"
              : "bg-red-600"
        )}
      />
      {status}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const styles: Record<UrgencyLevel, string> = {
    Normal: "bg-slate-100 text-slate-700 border-slate-200",
    Urgent: "bg-amber-50 text-amber-800 border-amber-200",
    Emergency: "bg-red-600 text-white border-red-700 shadow-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[urgency]
      )}
    >
      {urgency}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Pending: "bg-sky-50 text-sky-700 border-sky-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const label = status === "Approved" ? "Approved / Issued" : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      {label}
    </span>
  );
}

export function AvailabilityBadge({
  available,
  mode,
}: {
  available: boolean;
  mode?: "auto" | "manual";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        available
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          available ? "bg-emerald-500" : "bg-slate-400"
        )}
      />
      {available ? "Available" : "Unavailable"}
      {mode === "manual" && (
        <span className="text-[10px] opacity-75 font-medium">(Manual)</span>
      )}
    </span>
  );
}

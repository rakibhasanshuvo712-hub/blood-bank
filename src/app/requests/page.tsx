"use client";

import React, { useMemo, useState } from "react";
import {
  FilePlus2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  UserCheck,
  Building2,
  Phone,
} from "lucide-react";
import {
  BLOOD_GROUPS,
  BloodGroup,
  BloodRequest,
  RequestStatus,
  UrgencyLevel,
} from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import {
  BloodGroupBadge,
  RequestStatusBadge,
  UrgencyBadge,
} from "@/components/ui/Badges";
import { RequestModal } from "@/components/requests/RequestModal";
import { RequestDetailsModal } from "@/components/requests/RequestDetailsModal";
import { formatDateShort } from "@/lib/utils";

export default function RequestsPage() {
  const { requests, stock, approveRequest, rejectRequest } = useBloodBank();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "ALL">(
    "ALL"
  );
  const [groupFilter, setGroupFilter] = useState<BloodGroup | "ALL">("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(
    null
  );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
      if (urgencyFilter !== "ALL" && req.urgency !== urgencyFilter)
        return false;
      if (groupFilter !== "ALL" && req.bloodGroup !== groupFilter) return false;
      if (!q) return true;
      return (
        req.patientName.toLowerCase().includes(q) ||
        req.hospital.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        req.contactNumber.toLowerCase().includes(q)
      );
    });
  }, [groupFilter, requests, searchQuery, statusFilter, urgencyFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Blood Requests & Dispatch History
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Approving a request automatically deducts units from stock and logs
            the issuance. Use &ldquo;Match Donors&rdquo; to find compatible
            available donors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-crimson-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 shadow-sm transition-colors"
        >
          <FilePlus2 className="h-4 w-4" />
          New Blood Request
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "ALL", label: "All Requests", count: requests.length },
                {
                  key: "Pending",
                  label: "Pending",
                  count: requests.filter((r) => r.status === "Pending").length,
                },
                {
                  key: "Approved",
                  label: "Approved / Issued",
                  count: requests.filter((r) => r.status === "Approved").length,
                },
                {
                  key: "Rejected",
                  label: "Rejected",
                  count: requests.filter((r) => r.status === "Rejected").length,
                },
              ] as const
            ).map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setStatusFilter(pill.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === pill.key
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    statusFilter === pill.key
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, hospital, contact, or request ID..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RequestStatus | "ALL")
              }
              aria-label="Filter by status"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-crimson-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved / Issued</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={urgencyFilter}
              onChange={(e) =>
                setUrgencyFilter(e.target.value as UrgencyLevel | "ALL")
              }
              aria-label="Filter by urgency"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-crimson-500 focus:outline-none"
            >
              <option value="ALL">All Urgency Levels</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={groupFilter}
              onChange={(e) =>
                setGroupFilter(e.target.value as BloodGroup | "ALL")
              }
              aria-label="Filter by blood group"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-crimson-500 focus:outline-none"
            >
              <option value="ALL">All Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Patient / ID</th>
                <th className="px-4 py-3.5">Blood & Units</th>
                <th className="px-4 py-3.5">Hospital & Contact</th>
                <th className="px-4 py-3.5">Urgency</th>
                <th className="px-4 py-3.5">Date & Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No blood requests match your filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const avail = stock[req.bloodGroup] ?? 0;
                  const enough = avail >= req.unitsNeeded;

                  return (
                    <tr
                      key={req.id}
                      className={`transition-colors ${
                        req.status === "Pending" && req.urgency === "Emergency"
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {req.patientName}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
                          {req.id}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <BloodGroupBadge group={req.bloodGroup} />
                          <span className="text-xs font-bold text-slate-800">
                            {req.unitsNeeded} unit
                            {req.unitsNeeded > 1 ? "s" : ""}
                          </span>
                        </div>
                        {req.status === "Pending" && (
                          <p
                            className={`text-[11px] mt-1 ${
                              enough
                                ? "text-emerald-600"
                                : "text-red-600 font-semibold"
                            }`}
                          >
                            Stock: {avail} unit{avail === 1 ? "" : "s"}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[230px]">
                            {req.hospital}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {req.contactNumber}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <UrgencyBadge urgency={req.urgency} />
                      </td>

                      <td className="px-4 py-3.5">
                        <RequestStatusBadge status={req.status} />
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatDateShort(req.requestDate)}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            title="View Details & Smart Donor Matcher"
                          >
                            {req.status === "Pending" ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-crimson-600" />
                                Match / Details
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                Details
                              </>
                            )}
                          </button>

                          {req.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => approveRequest(req.id)}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                title="Approve & Issue Blood (Auto-deduct stock)"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectRequest(req.id)}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="Reject Request"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <RequestDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

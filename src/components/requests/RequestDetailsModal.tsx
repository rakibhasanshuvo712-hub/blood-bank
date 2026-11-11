"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  MapPin,
  Phone,
  Search,
  UserCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { BloodRequest } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/Modal";
import {
  BloodGroupBadge,
  RequestStatusBadge,
  UrgencyBadge,
} from "@/components/ui/Badges";
import { formatDateShort, formatDateTime } from "@/lib/utils";

interface RequestDetailsModalProps {
  request: BloodRequest | null;
  onClose: () => void;
}

export function RequestDetailsModal({
  request,
  onClose,
}: RequestDetailsModalProps) {
  const {
    stock,
    approveRequest,
    rejectRequest,
    getMatchingAvailableDonors,
  } = useBloodBank();
  const { showToast } = useToast();

  const [showMatcher, setShowMatcher] = useState(false);

  useEffect(() => {
    setShowMatcher(false);
  }, [request?.id]);

  if (!request) return null;

  const availableUnits = stock[request.bloodGroup] ?? 0;
  const hasEnoughStock = availableUnits >= request.unitsNeeded;
  const matchingDonors = showMatcher
    ? getMatchingAvailableDonors(request.bloodGroup)
    : [];

  const handleApprove = () => {
    const res = approveRequest(request.id);
    if (res.ok) {
      onClose();
    }
  };

  const handleReject = () => {
    const res = rejectRequest(request.id);
    if (res.ok) {
      onClose();
    }
  };

  const handleCopyPhone = (phone: string, name: string) => {
    navigator.clipboard?.writeText(phone).catch(() => {});
    showToast("Phone Copied", `${name}: ${phone}`, "info");
  };

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={`Blood Request ${request.id}`}
      subtitle={`Patient: ${request.patientName}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <BloodGroupBadge group={request.bloodGroup} size="lg" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {request.unitsNeeded} Unit{request.unitsNeeded > 1 ? "s" : ""}{" "}
                Required
              </p>
              <p className="text-xs text-slate-500">
                Current Stock: <strong>{availableUnits} unit(s)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={request.urgency} />
            <RequestStatusBadge status={request.status} />
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Hospital / Location
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {request.hospital}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Attendant Contact
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                {request.contactNumber}
              </p>
              <a
                href={`tel:${request.contactNumber.replace(/\D/g, "")}`}
                className="text-xs font-semibold text-crimson-600 hover:underline"
              >
                Call
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Request Date
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatDateShort(request.requestDate)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
            <p className="text-xs font-medium text-slate-400">
              Processing Audit
            </p>
            <p className="mt-1 text-xs font-medium text-slate-700">
              {request.processedBy
                ? `${request.processedBy} • ${formatDateTime(request.processedAt ?? "")}`
                : "Awaiting blood bank verification"}
            </p>
          </div>
        </div>

        {request.notes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Clinical Notes:</span>{" "}
            {request.notes}
          </div>
        )}

        {/* Stock Warning if Pending and insufficient */}
        {request.status === "Pending" && !hasEnoughStock && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Insufficient {request.bloodGroup} Stock ({availableUnits}{" "}
                available vs. {request.unitsNeeded} requested)
              </p>
              <p className="mt-0.5">
                Use the Smart Donor Matcher below to contact eligible{" "}
                {request.bloodGroup} donors or replenish inventory before
                approving.
              </p>
            </div>
          </div>
        )}

        {/* Smart Donor Matcher Section */}
        <div className="rounded-2xl border border-crimson-200 bg-crimson-50/40 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-crimson-600" />
                Smart Donor Matcher
              </h3>
              <p className="text-xs text-slate-600">
                Instantly locate eligible donors with exact{" "}
                <strong>{request.bloodGroup}</strong> blood group.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMatcher((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              {showMatcher
                ? "Hide Matching Donors"
                : "Find Matching Available Donors"}
            </button>
          </div>

          {showMatcher && (
            <div className="pt-2 border-t border-crimson-100">
              {matchingDonors.length === 0 ? (
                <p className="text-xs text-slate-600 py-3 text-center">
                  No currently available {request.bloodGroup} donors found in
                  the registry. Check donors in 90-day cooldown or coordinate
                  with partner blood banks.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {matchingDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">
                            {donor.id}
                          </span>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {donor.fullName}
                          </p>
                          <BloodGroupBadge group={donor.bloodGroup} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {donor.address} • Last donation:{" "}
                          {formatDateShort(donor.lastDonationDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPhone(donor.phone, donor.fullName)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="h-3 w-3" />
                          {donor.phone}
                        </button>
                        <a
                          href={`tel:${donor.phone.replace(/\D/g, "")}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons for Pending Requests */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {request.status === "Pending" && (
            <>
              <button
                type="button"
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!hasEnoughStock}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Issue ({request.unitsNeeded} unit
                {request.unitsNeeded > 1 ? "s" : ""})
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

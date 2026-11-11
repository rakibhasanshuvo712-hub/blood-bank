"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Info } from "lucide-react";
import { BLOOD_GROUPS, AvailabilityMode, BloodGroup, Donor } from "@/types";
import { DonorInput, useBloodBank } from "@/context/BloodBankContext";
import { Modal } from "@/components/ui/Modal";
import {
  getDaysSinceDonation,
  isEligibleBy90DayRule,
} from "@/lib/utils";

interface DonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDonor?: Donor | null;
}

export function DonorModal({ isOpen, onClose, editingDonor }: DonorModalProps) {
  const { addDonor, updateDonor } = useBloodBank();

  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [availabilityMode, setAvailabilityMode] =
    useState<AvailabilityMode>("auto");
  const [isAvailable, setIsAvailable] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingDonor) {
      setFullName(editingDonor.fullName);
      setBloodGroup(editingDonor.bloodGroup);
      setPhone(editingDonor.phone);
      setAddress(editingDonor.address);
      setLastDonationDate(editingDonor.lastDonationDate);
      setAvailabilityMode(editingDonor.availabilityMode);
      setIsAvailable(editingDonor.isAvailable);
      setNotes(editingDonor.notes ?? "");
    } else {
      setFullName("");
      setBloodGroup("O+");
      setPhone("");
      setAddress("");
      setLastDonationDate("");
      setAvailabilityMode("auto");
      setIsAvailable(true);
      setNotes("");
    }
  }, [editingDonor, isOpen]);

  const daysSince = getDaysSinceDonation(lastDonationDate);
  const autoEligible = isEligibleBy90DayRule(lastDonationDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: DonorInput = {
      fullName,
      bloodGroup,
      phone,
      address,
      lastDonationDate,
      availabilityMode,
      isAvailable: availabilityMode === "auto" ? autoEligible : isAvailable,
      notes,
    };

    const result = editingDonor
      ? updateDonor(editingDonor.id, payload)
      : addDonor(payload);

    if (!result.ok) {
      setError(result.error ?? "Please verify donor information.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDonor ? `Edit Donor (${editingDonor.id})` : "Register New Donor"}
      subtitle="Duplicate phone numbers are automatically blocked to maintain data integrity."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Md. Ashraful Islam"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Blood Group <span className="text-red-600">*</span>
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number (BD) <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01711-234567"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Location <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Dhanmondi 27, Dhaka"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Donation Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Leave blank if first-time donor.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Availability Rule
            </label>
            <select
              value={
                availabilityMode === "auto"
                  ? "auto"
                  : isAvailable
                    ? "manual_available"
                    : "manual_unavailable"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "auto") {
                  setAvailabilityMode("auto");
                  setIsAvailable(autoEligible);
                } else if (v === "manual_available") {
                  setAvailabilityMode("manual");
                  setIsAvailable(true);
                } else {
                  setAvailabilityMode("manual");
                  setIsAvailable(false);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              <option value="auto">Auto (90-Day Medical Rule)</option>
              <option value="manual_available">Manual: Available</option>
              <option value="manual_unavailable">Manual: Unavailable</option>
            </select>
          </div>
        </div>

        {/* Live 90-day rule helper banner */}
        <div
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
            autoEligible
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {autoEligible ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
          )}
          <span>
            {daysSince === null
              ? "No previous donation recorded — eligible to donate immediately."
              : autoEligible
                ? `Last donated ${daysSince} days ago (≥ 90 days) — medically eligible.`
                : `Last donated ${daysSince} days ago (${90 - daysSince} days remaining in 90-day cooldown).`}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferred donation hours, emergency contact notes, etc."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-crimson-600 px-5 py-2 text-sm font-semibold text-white hover:bg-crimson-700 shadow-sm"
          >
            {editingDonor ? "Save Changes" : "Register Donor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

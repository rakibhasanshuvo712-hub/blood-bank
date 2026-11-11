"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { BLOOD_GROUPS, BloodGroup, UrgencyLevel } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import { Modal } from "@/components/ui/Modal";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const { addRequest, stock } = useBloodBank();

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospital, setHospital] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Urgent");
  const [requestDate, setRequestDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPatientName("");
    setBloodGroup("O+");
    setUnitsNeeded(1);
    setHospital("");
    setContactNumber("");
    setUrgency("Urgent");
    setRequestDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setError(null);
  }, [isOpen]);

  const availableUnits = stock[bloodGroup] ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = addRequest({
      patientName,
      bloodGroup,
      unitsNeeded,
      hospital,
      contactNumber,
      urgency,
      requestDate,
      notes,
    });

    if (!res.ok) {
      setError(res.error ?? "Please verify all fields.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Blood Requisition Request"
      subtitle="Log an incoming patient or hospital blood request."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g., Md. Shafiqul Islam"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Blood Group <span className="text-red-600">*</span>
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} ({stock[bg]} units in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Units Needed <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={unitsNeeded}
              onChange={(e) =>
                setUnitsNeeded(Math.max(1, Number(e.target.value)))
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital / Medical Center <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g., Dhaka Medical College Hospital (DMCH)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attendant / Hospital Contact <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="01715-889900"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Request Date
            </label>
            <input
              type="date"
              required
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div className="flex items-end">
            <div
              className={`w-full rounded-xl border px-3.5 py-2 text-xs font-medium ${
                availableUnits >= unitsNeeded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {availableUnits >= unitsNeeded
                ? `In Stock: ${availableUnits} unit(s) ready`
                : `Low Stock (${availableUnits} avail.) — Donor matching recommended`}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ward/ICU details, diagnosis, cross-match instructions..."
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
            className="rounded-xl bg-crimson-600 px-5 py-2 text-sm font-semibold text-white hover:bg-crimson-700"
          >
            Submit Blood Request
          </button>
        </div>
      </form>
    </Modal>
  );
}

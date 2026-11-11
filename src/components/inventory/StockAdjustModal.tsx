"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { BLOOD_GROUPS, BloodGroup } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import { Modal } from "@/components/ui/Modal";

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroup?: BloodGroup;
}

export function StockAdjustModal({
  isOpen,
  onClose,
  defaultGroup = "O+",
}: StockAdjustModalProps) {
  const { stock, adjustStock } = useBloodBank();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(defaultGroup);
  const [operation, setOperation] = useState<"add" | "issue">("add");
  const [units, setUnits] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setBloodGroup(defaultGroup);
    setOperation("add");
    setUnits(1);
    setReason("");
    setError(null);
  }, [defaultGroup, isOpen]);

  const currentUnits = stock[bloodGroup] ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (units < 1) {
      setError("Units must be at least 1.");
      return;
    }

    const delta = operation === "add" ? units : -units;
    const res = adjustStock(
      bloodGroup,
      delta,
      reason.trim() ||
        (operation === "add"
          ? `Voluntary donor collection (+${units} unit${units > 1 ? "s" : ""})`
          : `Direct hospital issuance (-${units} unit${units > 1 ? "s" : ""})`),
      operation === "add" ? "addition" : "issuance"
    );

    if (!res.ok) {
      setError(res.error ?? "Failed to update stock.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Blood Bag Inventory"
      subtitle="Record incoming blood donations or manual bag issuances with audit trail."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} ({stock[bg]} units)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action Type
            </label>
            <select
              value={operation}
              onChange={(e) =>
                setOperation(e.target.value as "add" | "issue")
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              <option value="add">Add Stock (+)</option>
              <option value="issue">Issue / Deduct (-)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Number of Units (Bags)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            required
            value={units}
            onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Current stock: <strong>{currentUnits}</strong> → Projected:{" "}
            <strong
              className={
                operation === "issue" && currentUnits - units < 0
                  ? "text-red-600"
                  : "text-slate-900"
              }
            >
              {operation === "add" ? currentUnits + units : currentUnits - units}
            </strong>{" "}
            units
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Audit Note / Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              operation === "add"
                ? "e.g., Voluntary blood donation drive at BUET"
                : "e.g., Emergency ward dispatch"
            }
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
            Confirm Update
          </button>
        </div>
      </form>
    </Modal>
  );
}

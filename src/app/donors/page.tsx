"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Phone,
  MapPin,
  RefreshCw,
  Filter,
} from "lucide-react";
import { BLOOD_GROUPS, BloodGroup, Donor } from "@/types";
import { useBloodBank } from "@/context/BloodBankContext";
import { useAuth } from "@/context/AuthContext";
import { AvailabilityBadge, BloodGroupBadge } from "@/components/ui/Badges";
import { DonorModal } from "@/components/donors/DonorModal";
import { DonorViewModal } from "@/components/donors/DonorViewModal";
import { Modal } from "@/components/ui/Modal";
import {
  formatDateShort,
  getDaysSinceDonation,
  resolveDonorAvailability,
} from "@/lib/utils";

export default function DonorsPage() {
  const { donors, deleteDonor, toggleDonorAvailability } = useBloodBank();
  const { permissions } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<BloodGroup | "ALL">("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "ALL" | "AVAILABLE" | "UNAVAILABLE"
  >("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [viewingDonor, setViewingDonor] = useState<Donor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Donor | null>(null);

  const filteredDonors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return donors.filter((donor) => {
      if (groupFilter !== "ALL" && donor.bloodGroup !== groupFilter) {
        return false;
      }
      const available = resolveDonorAvailability(donor);
      if (availabilityFilter === "AVAILABLE" && !available) return false;
      if (availabilityFilter === "UNAVAILABLE" && available) return false;

      if (!q) return true;
      return (
        donor.fullName.toLowerCase().includes(q) ||
        donor.phone.toLowerCase().includes(q) ||
        donor.address.toLowerCase().includes(q) ||
        donor.id.toLowerCase().includes(q)
      );
    });
  }, [availabilityFilter, donors, groupFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingDonor(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteDonor(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Donor Management Registry
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {donors.length} registered donors • Enforces 90-day medical cooldown
            & duplicate phone prevention.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-crimson-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 shadow-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add New Donor
        </button>
      </div>

      {/* Multi-Filter Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  key: "ALL",
                  label: "All Donors",
                  count: donors.length,
                },
                {
                  key: "AVAILABLE",
                  label: "Available Now",
                  count: donors.filter((d) => resolveDonorAvailability(d))
                    .length,
                },
                {
                  key: "UNAVAILABLE",
                  label: "Unavailable / Cooldown",
                  count: donors.filter((d) => !resolveDonorAvailability(d))
                    .length,
                },
              ] as const
            ).map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setAvailabilityFilter(pill.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  availabilityFilter === pill.key
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    availabilityFilter === pill.key
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
            Showing {filteredDonors.length} of {donors.length} donors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by donor name, phone, address, or ID..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            />
          </div>

          <div className="md:col-span-3 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={groupFilter}
              onChange={(e) =>
                setGroupFilter(e.target.value as BloodGroup | "ALL")
              }
              aria-label="Filter by blood group"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Group {bg}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(
                  e.target.value as "ALL" | "AVAILABLE" | "UNAVAILABLE"
                )
              }
              aria-label="Filter by availability"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
            >
              <option value="ALL">All Availability Status</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="UNAVAILABLE">Unavailable Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Donor</th>
                <th className="px-4 py-3.5">Blood Group</th>
                <th className="px-4 py-3.5">Contact & Location</th>
                <th className="px-4 py-3.5">Last Donation</th>
                <th className="px-4 py-3.5">Availability</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDonors.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No donors match your current filters.
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => {
                  const available = resolveDonorAvailability(donor);
                  const daysSince = getDaysSinceDonation(
                    donor.lastDonationDate
                  );

                  return (
                    <tr
                      key={donor.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {donor.fullName}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
                          {donor.id}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <BloodGroupBadge group={donor.bloodGroup} />
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {donor.phone}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[220px]">
                            {donor.address}
                          </span>
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-slate-800">
                          {formatDateShort(donor.lastDonationDate)}
                        </p>
                        {daysSince !== null && (
                          <p
                            className={`text-[11px] mt-0.5 ${
                              daysSince < 90
                                ? "text-amber-600 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            {daysSince}d ago
                            {daysSince < 90
                              ? ` (${90 - daysSince}d cooldown)`
                              : ""}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <AvailabilityBadge
                            available={available}
                            mode={donor.availabilityMode}
                          />
                          <button
                            type="button"
                            onClick={() => toggleDonorAvailability(donor.id)}
                            title="Toggle availability manually"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingDonor(donor)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(donor)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                            title="Edit Donor"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(donor)}
                            disabled={!permissions.canDeleteDonor}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-35 disabled:cursor-not-allowed"
                            title={
                              permissions.canDeleteDonor
                                ? "Delete Donor"
                                : "Admin access required to delete"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
      <DonorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingDonor={editingDonor}
      />

      <DonorViewModal
        donor={viewingDonor}
        onClose={() => setViewingDonor(null)}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete Donor Record?"
        subtitle={
          confirmDelete
            ? `${confirmDelete.fullName} (${confirmDelete.id})`
            : undefined
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently remove this donor from the
            registry?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete Donor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

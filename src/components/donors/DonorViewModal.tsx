"use client";

import React from "react";
import { Phone, MapPin, Calendar, Clock, FileText } from "lucide-react";
import { Donor } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { AvailabilityBadge, BloodGroupBadge } from "@/components/ui/Badges";
import {
  formatDateShort,
  getDaysSinceDonation,
  resolveDonorAvailability,
} from "@/lib/utils";

interface DonorViewModalProps {
  donor: Donor | null;
  onClose: () => void;
}

export function DonorViewModal({ donor, onClose }: DonorViewModalProps) {
  if (!donor) return null;

  const available = resolveDonorAvailability(donor);
  const daysSince = getDaysSinceDonation(donor.lastDonationDate);

  return (
    <Modal
      isOpen={Boolean(donor)}
      onClose={onClose}
      title={donor.fullName}
      subtitle={`Donor Registry ID: ${donor.id}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <BloodGroupBadge group={donor.bloodGroup} size="lg" />
            <div>
              <p className="text-xs text-slate-500">Current Eligibility</p>
              <div className="mt-1">
                <AvailabilityBadge
                  available={available}
                  mode={donor.availabilityMode}
                />
              </div>
            </div>
          </div>
          <a
            href={`tel:${donor.phone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-crimson-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-crimson-700 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Donor
          </a>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Contact Number</p>
              <p className="font-medium text-slate-900">{donor.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Location / Address</p>
              <p className="font-medium text-slate-900">{donor.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Last Donation Date</p>
              <p className="font-medium text-slate-900">
                {formatDateShort(donor.lastDonationDate)}
                {daysSince !== null && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({daysSince} days ago)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Registered On</p>
              <p className="font-medium text-slate-900">
                {formatDateShort(donor.createdAt)}
              </p>
            </div>
          </div>

          {donor.notes && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Notes</p>
                <p className="text-xs text-slate-700 mt-0.5">{donor.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

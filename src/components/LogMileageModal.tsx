"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import { format } from "date-fns";

interface Props {
  vehicleId: string;
  vehicleName: string;
  currentMileage: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function LogMileageModal({ vehicleId, vehicleName, currentMileage, onClose, onSaved }: Props) {
  const [mileage, setMileage] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(mileage) < currentMileage) {
      toast.error("Mileage cannot be lower than current odometer reading");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/mileage-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, mileage, notes }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Mileage updated");
      onSaved();
      onClose();
    } else {
      toast.error("Failed to update mileage");
    }
  }

  return (
    <Modal title={`Log Mileage — ${vehicleName}`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="field-label">Current Odometer</label>
          <p className="text-sm text-zinc-500 mb-2">{currentMileage.toLocaleString()} mi on file</p>
          <input
            type="number"
            className="field"
            placeholder="New reading"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">Date</label>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Notes (optional)</label>
          <input className="field" placeholder="e.g. After track day" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

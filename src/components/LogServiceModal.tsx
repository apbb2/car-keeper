"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import { DEFAULT_SCHEDULES } from "@/lib/maintenance";
import { format } from "date-fns";
import type { ServiceRecord } from "@/generated/prisma/client";

interface Props {
  vehicleId: string;
  vehicleName: string;
  onClose: () => void;
  onSaved: () => void;
  prefillTask?: string;
  record?: ServiceRecord;
}

const TASK_OPTIONS = DEFAULT_SCHEDULES.map((s) => s.taskName);

export default function LogServiceModal({ vehicleId, vehicleName, onClose, onSaved, prefillTask, record }: Props) {
  const isEdit = !!record;
  const taskIsStandard = record ? TASK_OPTIONS.includes(record.taskName) : true;

  const [form, setForm] = useState({
    taskName: record?.taskName || prefillTask || TASK_OPTIONS[0],
    customTask: (!taskIsStandard && record?.taskName) || "",
    useCustom: !taskIsStandard,
    date: record ? format(new Date(record.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    mileage: record?.mileage?.toString() || "",
    cost: record?.cost?.toString() || "",
    performedBy: record?.performedBy || "DIY",
    shopName: record?.shopName || "",
    notes: record?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const taskName = form.useCustom ? form.customTask : form.taskName;
    const url = isEdit
      ? `/api/vehicles/${vehicleId}/service-records/${record.id}`
      : `/api/vehicles/${vehicleId}/service-records`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, taskName }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Record updated" : "Service record saved");
      onSaved();
      onClose();
    } else {
      toast.error("Failed to save record");
    }
  }

  return (
    <Modal title={isEdit ? `Edit Record — ${vehicleName}` : `Log Service — ${vehicleName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="field-label">Task Type</label>
          <div className="flex gap-3 mb-2">
            <button type="button" onClick={() => set("useCustom", false)} className={`text-xs px-3 py-1 rounded-full border ${!form.useCustom ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300 text-zinc-600"}`}>Standard</button>
            <button type="button" onClick={() => set("useCustom", true)} className={`text-xs px-3 py-1 rounded-full border ${form.useCustom ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300 text-zinc-600"}`}>Custom</button>
          </div>
          {form.useCustom ? (
            <input className="field" placeholder="e.g. Timing belt replacement" value={form.customTask} onChange={(e) => set("customTask", e.target.value)} required />
          ) : (
            <select className="field" value={form.taskName} onChange={(e) => set("taskName", e.target.value)}>
              {TASK_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="field" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Mileage at Service</label>
            <input type="number" className="field" placeholder="e.g. 48200" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Cost ($)</label>
            <input type="number" step="0.01" className="field" placeholder="0.00" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Performed By</label>
            <select className="field" value={form.performedBy} onChange={(e) => set("performedBy", e.target.value)}>
              <option value="DIY">DIY</option>
              <option value="Shop">Shop / Dealer</option>
            </select>
          </div>
        </div>

        {form.performedBy === "Shop" && (
          <div>
            <label className="field-label">Shop Name</label>
            <input className="field" placeholder="e.g. Jiffy Lube" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} />
          </div>
        )}

        <div>
          <label className="field-label">Notes (optional)</label>
          <textarea className="field" rows={2} placeholder="Any notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : isEdit ? "Update Record" : "Save Record"}</button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Upload } from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_SCHEDULES } from "@/lib/maintenance";
import type { Vehicle } from "@/generated/prisma/client";

interface Props {
  vehicle?: Vehicle;
}

export default function VehicleForm({ vehicle }: Props) {
  const isEdit = !!vehicle;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    year: vehicle?.year?.toString() || new Date().getFullYear().toString(),
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    trim: vehicle?.trim || "",
    color: vehicle?.color || "",
    vin: vehicle?.vin || "",
    purchaseDate: vehicle?.purchaseDate ? format(new Date(vehicle.purchaseDate), "yyyy-MM-dd") : "",
    mileage: vehicle?.mileage?.toString() || "0",
    notes: vehicle?.notes || "",
    applyDefaultSchedule: true,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(vehicle?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(vehicleId: string): Promise<string | null> {
    if (!photoFile) return vehicle?.photoUrl || null;
    const fd = new FormData();
    fd.append("file", photoFile);
    fd.append("vehicleId", vehicleId);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = vehicle?.photoUrl || null;

      if (isEdit) {
        const res = await fetch(`/api/vehicles/${vehicle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, photoUrl }),
        });
        if (!res.ok) throw new Error("Failed to update");
        if (photoFile) {
          const uploaded = await uploadPhoto(vehicle.id);
          if (uploaded) {
            await fetch(`/api/vehicles/${vehicle.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, photoUrl: uploaded }),
            });
            toast.success("Vehicle updated");
          } else {
            toast.error("Photo upload failed — vehicle saved without photo");
          }
        } else {
          toast.success("Vehicle updated");
        }
        router.push(`/vehicles/${vehicle.id}`);
        router.refresh();
      } else {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, photoUrl: null }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        if (photoFile) {
          const uploaded = await uploadPhoto(created.id);
          if (uploaded) {
            await fetch(`/api/vehicles/${created.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, photoUrl: uploaded }),
            });
            toast.success("Vehicle added to garage");
          } else {
            toast.error("Photo upload failed — vehicle saved without photo");
          }
        } else {
          toast.success("Vehicle added to garage");
        }
        router.push(`/vehicles/${created.id}`);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">{isEdit ? `Edit — ${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Add Vehicle"}</h1>
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Photo + Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-5">Vehicle Details</h2>

              {/* Photo */}
              <div className="mb-6">
                <label className="field-label">Photo</label>
                <div
                  className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors overflow-hidden relative"
                  onClick={() => fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Vehicle" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Car className="w-10 h-10 text-zinc-300 mb-2" />
                      <p className="text-sm text-zinc-400">Click to upload photo</p>
                    </>
                  )}
                  {photoPreview && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Year *</label>
                  <input type="number" className="field" min="1886" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => set("year", e.target.value)} required />
                </div>
                <div>
                  <label className="field-label">Make *</label>
                  <input className="field" placeholder="e.g. Ford" value={form.make} onChange={(e) => set("make", e.target.value)} required />
                </div>
                <div>
                  <label className="field-label">Model *</label>
                  <input className="field" placeholder="e.g. Mustang" value={form.model} onChange={(e) => set("model", e.target.value)} required />
                </div>
                <div>
                  <label className="field-label">Trim / Body Style</label>
                  <input className="field" placeholder="e.g. Fastback, Coupe" value={form.trim} onChange={(e) => set("trim", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Color</label>
                  <input className="field" placeholder="e.g. Candy Apple Red" value={form.color} onChange={(e) => set("color", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">VIN</label>
                  <input className="field" placeholder="17-character VIN" value={form.vin} onChange={(e) => set("vin", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Purchase Date</label>
                  <input type="date" className="field" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Current Mileage</label>
                  <input type="number" className="field" min="0" placeholder="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Schedule */}
          <div className="space-y-6">
            {!isEdit && (
              <div className="card p-6">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Maintenance Schedule</h2>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.applyDefaultSchedule}
                    onChange={(e) => set("applyDefaultSchedule", e.target.checked)}
                  />
                  <span className="text-sm text-zinc-600">Apply default maintenance schedule</span>
                </label>
                <div className="space-y-1 text-xs text-zinc-400">
                  {DEFAULT_SCHEDULES.map((s) => (
                    <div key={s.taskName} className="flex justify-between">
                      <span>{s.taskName}</span>
                      <span>
                        {s.intervalMonths && `${s.intervalMonths} mo`}
                        {s.intervalMonths && s.intervalMiles && " / "}
                        {s.intervalMiles && `${s.intervalMiles.toLocaleString()} mi`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-100">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add to Garage"}
          </button>
        </div>
      </div>
    </form>
  );
}

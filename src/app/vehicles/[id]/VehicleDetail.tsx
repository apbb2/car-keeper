"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Car, ChevronLeft, Edit, Gauge, PlusCircle, Trash2, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import LogServiceModal from "@/components/LogServiceModal";
import LogMileageModal from "@/components/LogMileageModal";
import { computeScheduleStatus } from "@/lib/maintenance";
import { formatCurrency, formatMileage } from "@/lib/utils";
import type { Vehicle, MaintenanceSchedule, ServiceRecord, MileageLog, Document } from "@/generated/prisma/client";

type FullVehicle = Vehicle & {
  schedules: MaintenanceSchedule[];
  serviceRecords: ServiceRecord[];
  mileageLogs: MileageLog[];
  documents: Document[];
};

type Tab = "schedule" | "history" | "documents" | "mileage" | "notes";

export default function VehicleDetail({ vehicle: initial }: { vehicle: FullVehicle }) {
  const [vehicle, setVehicle] = useState(initial);
  const [tab, setTab] = useState<Tab>("schedule");
  const [showService, setShowService] = useState(false);
  const [showMileage, setShowMileage] = useState(false);
  const [prefillTask, setPrefillTask] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  async function refresh() {
    const res = await fetch(`/api/vehicles/${vehicle.id}`);
    if (res.ok) setVehicle(await res.json());
  }

  async function deleteVehicle() {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Vehicle deleted"); router.push("/garage"); }
    else { toast.error("Failed to delete"); setDeleting(false); }
  }

  async function deleteRecord(recordId: string) {
    if (!confirm("Delete this service record?")) return;
    const res = await fetch(`/api/vehicles/${vehicle.id}/service-records/${recordId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Record deleted"); refresh(); }
    else toast.error("Failed to delete");
  }

  async function deleteDocument(docId: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/vehicles/${vehicle.id}/documents/${docId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Document deleted"); refresh(); }
    else toast.error("Failed to delete");
  }

  async function addDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/vehicles/${vehicle.id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: fd.get("type"), name: fd.get("name"), fileUrl: fd.get("fileUrl"), notes: fd.get("notes") }),
    });
    if (res.ok) { toast.success("Document added"); refresh(); (e.target as HTMLFormElement).reset(); }
    else toast.error("Failed to add document");
  }

  const schedulesWithStatus = vehicle.schedules.map((s) => computeScheduleStatus(s, vehicle.mileage));
  const overdueCount = schedulesWithStatus.filter((s) => s.status === "overdue" || s.status === "never-done").length;
  const dueSoonCount = schedulesWithStatus.filter((s) => s.status === "due-soon").length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "schedule", label: "Maintenance Schedule" },
    { id: "history", label: "Service History" },
    { id: "documents", label: "Documents" },
    { id: "mileage", label: "Mileage Log" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <>
      <div className="page-header">
        <Link href="/garage" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-4 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Back to Garage
        </Link>

        <div className="flex gap-6 items-start">
          <div className="w-40 h-28 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
            {vehicle.photoUrl ? (
              <img src={vehicle.photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Car className="w-10 h-10 text-zinc-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
                {vehicle.trim && <p className="text-sm text-zinc-500">{vehicle.trim}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-500">
                  {vehicle.color && <span>{vehicle.color}</span>}
                  {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                  {vehicle.purchaseDate && <span>Purchased {format(new Date(vehicle.purchaseDate), "MMM yyyy")}</span>}
                  <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{formatMileage(vehicle.mileage)}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {overdueCount > 0 && <StatusBadge status="overdue" />}
                  {dueSoonCount > 0 && <StatusBadge status="due-soon" />}
                  {overdueCount === 0 && dueSoonCount === 0 && <StatusBadge status="good" />}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowMileage(true)} className="btn-secondary text-xs gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Log Mileage
                </button>
                <button onClick={() => { setPrefillTask(undefined); setShowService(true); }} className="btn-primary text-xs gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" /> Log Service
                </button>
                <Link href={`/vehicles/${vehicle.id}/edit`} className="btn-secondary text-xs">
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button onClick={deleteVehicle} disabled={deleting} className="btn-secondary text-xs text-red-500 hover:text-red-700">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-100 bg-white px-8">
        <div className="flex gap-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* Schedule Tab */}
        {tab === "schedule" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-zinc-500">{schedulesWithStatus.length} tasks tracked</p>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Task</th>
                    <th className="px-5 py-3 text-left font-semibold">Interval</th>
                    <th className="px-5 py-3 text-left font-semibold">Last Done</th>
                    <th className="px-5 py-3 text-left font-semibold">Next Due</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {schedulesWithStatus.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50">
                      <td className="px-5 py-3.5 font-medium text-zinc-900">{s.taskName}</td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs">
                        {s.intervalMonths && `${s.intervalMonths} mo`}
                        {s.intervalMonths && s.intervalMiles && " / "}
                        {s.intervalMiles && `${s.intervalMiles.toLocaleString()} mi`}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs">
                        {s.lastDoneDate ? format(new Date(s.lastDoneDate), "MMM yyyy") : "—"}
                        {s.lastDoneMileage && <span className="block text-zinc-400">{s.lastDoneMileage.toLocaleString()} mi</span>}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs">
                        {s.nextDueDate ? format(new Date(s.nextDueDate), "MMM yyyy") : "—"}
                        {s.nextDueMileage && <span className="block text-zinc-400">{s.nextDueMileage.toLocaleString()} mi</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => { setPrefillTask(s.taskName); setShowService(true); }}
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                        >
                          Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-zinc-500">{vehicle.serviceRecords.length} records</p>
              <button onClick={() => { setPrefillTask(undefined); setShowService(true); }} className="btn-primary text-xs">
                <PlusCircle className="w-3.5 h-3.5" /> Log Service
              </button>
            </div>
            {vehicle.serviceRecords.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-12">No service records yet.</p>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Date</th>
                      <th className="px-5 py-3 text-left font-semibold">Task</th>
                      <th className="px-5 py-3 text-left font-semibold">Mileage</th>
                      <th className="px-5 py-3 text-left font-semibold">Cost</th>
                      <th className="px-5 py-3 text-left font-semibold">By</th>
                      <th className="px-5 py-3 text-left font-semibold">Notes</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {vehicle.serviceRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/50">
                        <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap">{format(new Date(r.date), "MMM d, yyyy")}</td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900">{r.taskName}</td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">{r.mileage ? r.mileage.toLocaleString() : "—"}</td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">{r.cost ? formatCurrency(r.cost) : "—"}</td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">
                          {r.performedBy === "Shop" && r.shopName ? r.shopName : r.performedBy}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400 text-xs max-w-xs truncate">{r.notes || "—"}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => deleteRecord(r.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {tab === "documents" && (
          <div className="space-y-6">
            {vehicle.documents.length > 0 && (
              <div className="card divide-y divide-zinc-50">
                {vehicle.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{d.name}</p>
                        <p className="text-xs text-zinc-400">{d.type} · {format(new Date(d.createdAt), "MMM d, yyyy")}</p>
                        {d.notes && <p className="text-xs text-zinc-400 mt-0.5">{d.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.fileUrl && (
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                          <Upload className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => deleteDocument(d.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-zinc-700 mb-4">Add Document</h3>
              <form onSubmit={addDocument} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Type</label>
                  <select name="type" className="field">
                    <option>Title</option>
                    <option>Insurance</option>
                    <option>Receipt</option>
                    <option>Manual</option>
                    <option>Inspection</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Name</label>
                  <input name="name" className="field" placeholder="e.g. Insurance Card 2026" required />
                </div>
                <div className="col-span-2">
                  <label className="field-label">URL (optional)</label>
                  <input name="fileUrl" className="field" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="field-label">Notes (optional)</label>
                  <input name="notes" className="field" placeholder="Any notes..." />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button type="submit" className="btn-primary text-xs">Add Document</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mileage Log Tab */}
        {tab === "mileage" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-zinc-500">Current: {formatMileage(vehicle.mileage)}</p>
              <button onClick={() => setShowMileage(true)} className="btn-primary text-xs">
                <Gauge className="w-3.5 h-3.5" /> Log Mileage
              </button>
            </div>
            {vehicle.mileageLogs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-12">No mileage logs yet.</p>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Date</th>
                      <th className="px-5 py-3 text-left font-semibold">Mileage</th>
                      <th className="px-5 py-3 text-left font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {vehicle.mileageLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-50/50">
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">{format(new Date(l.date), "MMM d, yyyy")}</td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900">{l.mileage.toLocaleString()} mi</td>
                        <td className="px-5 py-3.5 text-zinc-400 text-xs">{l.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {tab === "notes" && (
          <NotesEditor vehicleId={vehicle.id} initialNotes={vehicle.notes || ""} onSaved={refresh} />
        )}
      </div>

      {showService && (
        <LogServiceModal
          vehicleId={vehicle.id}
          vehicleName={name}
          prefillTask={prefillTask}
          onClose={() => { setShowService(false); setPrefillTask(undefined); }}
          onSaved={refresh}
        />
      )}
      {showMileage && (
        <LogMileageModal
          vehicleId={vehicle.id}
          vehicleName={name}
          currentMileage={vehicle.mileage}
          onClose={() => setShowMileage(false)}
          onSaved={refresh}
        />
      )}
    </>
  );
}

function NotesEditor({ vehicleId, initialNotes, onSaved }: { vehicleId: string; initialNotes: string; onSaved: () => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Notes saved"); onSaved(); }
    else toast.error("Failed to save notes");
  }

  return (
    <div className="space-y-3">
      <textarea
        className="field min-h-48 resize-y"
        placeholder="Storage location, quirks, known issues, show history, purchase story..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary text-xs">{saving ? "Saving…" : "Save Notes"}</button>
      </div>
    </div>
  );
}

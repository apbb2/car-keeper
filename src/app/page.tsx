import Link from "next/link";
import { format, addDays } from "date-fns";
import { AlertCircle, Clock, Car, DollarSign, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";
import { computeScheduleStatus } from "@/lib/maintenance";
import type { TaskStatus } from "@/lib/maintenance";

async function getDashboard(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { schedules: true, serviceRecords: { orderBy: { date: "desc" }, take: 10 } },
    orderBy: { year: "asc" },
  });

  const now = new Date();
  const in90Days = addDays(now, 90);

  const attention: { vehicleId: string; vehicleName: string; taskName: string; status: TaskStatus; nextDueDate: Date | null }[] = [];
  const upcoming: typeof attention = [];
  let totalSpentThisYear = 0;
  const recentActivity: { date: Date; vehicleName: string; taskName: string; cost: number | null; performedBy: string }[] = [];

  for (const vehicle of vehicles) {
    const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    for (const schedule of vehicle.schedules) {
      const s = computeScheduleStatus(schedule, vehicle.mileage);
      if (s.status === "overdue" || s.status === "never-done" || s.status === "due-soon") {
        attention.push({ vehicleId: vehicle.id, vehicleName: name, taskName: schedule.taskName, status: s.status, nextDueDate: s.nextDueDate });
      } else if (s.nextDueDate && s.nextDueDate <= in90Days) {
        upcoming.push({ vehicleId: vehicle.id, vehicleName: name, taskName: schedule.taskName, status: s.status, nextDueDate: s.nextDueDate });
      }
    }
    for (const record of vehicle.serviceRecords) {
      if (new Date(record.date).getFullYear() === now.getFullYear() && record.cost) totalSpentThisYear += record.cost;
      recentActivity.push({ date: record.date, vehicleName: name, taskName: record.taskName, cost: record.cost, performedBy: record.performedBy });
    }
  }

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalVehicles: vehicles.length,
    attention: attention.slice(0, 10),
    upcoming: upcoming.sort((a, b) => (a.nextDueDate?.getTime() ?? 0) - (b.nextDueDate?.getTime() ?? 0)).slice(0, 10),
    totalSpentThisYear,
    recentActivity: recentActivity.slice(0, 10),
    overdueCount: attention.filter((a) => a.status === "overdue" || a.status === "never-done").length,
    dueSoonCount: attention.filter((a) => a.status === "due-soon").length,
  };
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const data = await getDashboard(user.id);
  const today = new Date();

  return (
    <>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="page-content space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Car className="w-5 h-5 text-zinc-500" />} value={data.totalVehicles} label="Vehicles" />
          <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />} value={data.dueSoonCount} label="Due Soon" accent="amber" />
          <StatCard icon={<AlertCircle className="w-5 h-5 text-red-500" />} value={data.overdueCount} label="Overdue" accent="red" />
          <StatCard icon={<DollarSign className="w-5 h-5 text-green-500" />} value={formatCurrency(data.totalSpentThisYear)} label={`Spent in ${today.getFullYear()}`} />
        </div>

        {data.attention.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Needs Attention</h2>
            <div className="card divide-y divide-zinc-50">
              {data.attention.map((item, i) => (
                <Link key={i} href={`/vehicles/${item.vehicleId}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={item.status} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{item.vehicleName}</p>
                      <p className="text-xs text-zinc-500">{item.taskName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {item.nextDueDate && <span>{format(new Date(item.nextDueDate), "MMM yyyy")}</span>}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Upcoming — Next 90 Days</h2>
            <div className="card divide-y divide-zinc-50">
              {data.upcoming.map((item, i) => (
                <Link key={i} href={`/vehicles/${item.vehicleId}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{item.vehicleName}</p>
                    <p className="text-xs text-zinc-500">{item.taskName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {item.nextDueDate && <span>{format(new Date(item.nextDueDate), "MMM d, yyyy")}</span>}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.recentActivity.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Recent Activity</h2>
            <div className="card divide-y divide-zinc-50">
              {data.recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{item.vehicleName}</p>
                    <p className="text-xs text-zinc-500">{item.taskName} · {item.performedBy}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>{item.cost ? formatCurrency(item.cost) : "—"}</p>
                    <p>{format(new Date(item.date), "MMM d, yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.totalVehicles === 0 && (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-700 mb-2">No vehicles yet</h2>
            <p className="text-sm text-zinc-400 mb-6">Add your first car to start tracking maintenance.</p>
            <Link href="/vehicles/new" className="btn-primary">Add Your First Vehicle</Link>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent?: "red" | "amber" }) {
  return (
    <div className="card px-5 py-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${accent === "red" ? "text-red-600" : accent === "amber" ? "text-amber-600" : "text-zinc-900"}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

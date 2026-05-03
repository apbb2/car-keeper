import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeScheduleStatus } from "@/lib/maintenance";
import { getUser } from "@/lib/supabase-server";
import { addDays } from "date-fns";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    include: { schedules: true, serviceRecords: { orderBy: { date: "desc" }, take: 10 } },
    orderBy: { year: "asc" },
  });

  const now = new Date();
  const in90Days = addDays(now, 90);

  const attention: {
    vehicleId: string;
    vehicleName: string;
    taskName: string;
    status: string;
    nextDueDate: Date | null;
  }[] = [];

  const upcoming: typeof attention = [];

  let totalSpentThisYear = 0;
  const recentActivity: {
    date: Date;
    vehicleName: string;
    taskName: string;
    cost: number | null;
    performedBy: string;
  }[] = [];

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
      if (new Date(record.date).getFullYear() === now.getFullYear() && record.cost) {
        totalSpentThisYear += record.cost;
      }
      recentActivity.push({
        date: record.date,
        vehicleName: name,
        taskName: record.taskName,
        cost: record.cost,
        performedBy: record.performedBy,
      });
    }
  }

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    totalVehicles: vehicles.length,
    attention: attention.slice(0, 10),
    upcoming: upcoming.sort((a, b) => (a.nextDueDate?.getTime() ?? 0) - (b.nextDueDate?.getTime() ?? 0)).slice(0, 10),
    totalSpentThisYear,
    recentActivity: recentActivity.slice(0, 10),
    overdueCount: attention.filter((a) => a.status === "overdue" || a.status === "never-done").length,
    dueSoonCount: attention.filter((a) => a.status === "due-soon").length,
  });
}

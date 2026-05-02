import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const body = await req.json();
  const { taskName, intervalMonths, intervalMiles, lastDoneDate, lastDoneMileage } = body;

  const schedule = await prisma.maintenanceSchedule.update({
    where: { id: scheduleId },
    data: {
      taskName: taskName ?? undefined,
      intervalMonths: intervalMonths !== undefined ? (intervalMonths ? Number(intervalMonths) : null) : undefined,
      intervalMiles: intervalMiles !== undefined ? (intervalMiles ? Number(intervalMiles) : null) : undefined,
      lastDoneDate: lastDoneDate ? new Date(lastDoneDate) : undefined,
      lastDoneMileage: lastDoneMileage !== undefined ? (lastDoneMileage ? Number(lastDoneMileage) : null) : undefined,
    },
  });
  return NextResponse.json(schedule);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { scheduleId } = await params;
  await prisma.maintenanceSchedule.delete({ where: { id: scheduleId } });
  return NextResponse.json({ ok: true });
}

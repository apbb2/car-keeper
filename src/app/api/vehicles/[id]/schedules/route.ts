import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedules = await prisma.maintenanceSchedule.findMany({
    where: { vehicleId: id },
    orderBy: { taskName: "asc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { taskName, intervalMonths, intervalMiles } = body;

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: id,
      taskName,
      intervalMonths: intervalMonths ? Number(intervalMonths) : null,
      intervalMiles: intervalMiles ? Number(intervalMiles) : null,
    },
  });
  return NextResponse.json(schedule, { status: 201 });
}

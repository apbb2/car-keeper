import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const schedules = await prisma.maintenanceSchedule.findMany({
    where: { vehicleId: id, vehicle: { userId: user.id } },
    orderBy: { taskName: "asc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { taskName, intervalMonths, intervalMiles } = body;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

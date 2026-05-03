import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const records = await prisma.serviceRecord.findMany({
    where: { vehicleId: id, vehicle: { userId: user.id } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { taskName, date, mileage, cost, performedBy, shopName, notes } = body;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.serviceRecord.create({
    data: {
      vehicleId: id,
      taskName,
      date: new Date(date),
      mileage: mileage ? Number(mileage) : null,
      cost: cost ? Number(cost) : null,
      performedBy: performedBy || "DIY",
      shopName: shopName || null,
      notes: notes || null,
    },
  });

  const schedule = await prisma.maintenanceSchedule.findFirst({ where: { vehicleId: id, taskName } });
  if (schedule) {
    await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        lastDoneDate: new Date(date),
        lastDoneMileage: mileage ? Number(mileage) : schedule.lastDoneMileage,
      },
    });
  }

  if (mileage && Number(mileage) > vehicle.mileage) {
    await prisma.vehicle.update({ where: { id }, data: { mileage: Number(mileage) } });
  }

  return NextResponse.json(record, { status: 201 });
}

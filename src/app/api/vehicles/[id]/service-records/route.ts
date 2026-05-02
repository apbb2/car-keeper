import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await prisma.serviceRecord.findMany({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { taskName, date, mileage, cost, performedBy, shopName, notes } = body;

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

  // Update matching schedule's lastDoneDate + lastDoneMileage
  const schedule = await prisma.maintenanceSchedule.findFirst({
    where: { vehicleId: id, taskName },
  });
  if (schedule) {
    await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        lastDoneDate: new Date(date),
        lastDoneMileage: mileage ? Number(mileage) : schedule.lastDoneMileage,
      },
    });
  }

  // Update vehicle mileage if higher
  if (mileage) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (vehicle && Number(mileage) > vehicle.mileage) {
      await prisma.vehicle.update({ where: { id }, data: { mileage: Number(mileage) } });
    }
  }

  return NextResponse.json(record, { status: 201 });
}

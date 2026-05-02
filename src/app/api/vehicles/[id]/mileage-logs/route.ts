import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logs = await prisma.mileageLog.findMany({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { date, mileage, notes } = body;

  const log = await prisma.mileageLog.create({
    data: { vehicleId: id, date: new Date(date), mileage: Number(mileage), notes: notes || null },
  });

  // Update vehicle current mileage if higher
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (vehicle && Number(mileage) > vehicle.mileage) {
    await prisma.vehicle.update({ where: { id }, data: { mileage: Number(mileage) } });
  }

  return NextResponse.json(log, { status: 201 });
}

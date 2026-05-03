import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const logs = await prisma.mileageLog.findMany({
    where: { vehicleId: id, vehicle: { userId: user.id } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { date, mileage, notes } = body;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await prisma.mileageLog.create({
    data: { vehicleId: id, date: new Date(date), mileage: Number(mileage), notes: notes || null },
  });

  if (Number(mileage) > vehicle.mileage) {
    await prisma.vehicle.update({ where: { id }, data: { mileage: Number(mileage) } });
  }

  return NextResponse.json(log, { status: 201 });
}

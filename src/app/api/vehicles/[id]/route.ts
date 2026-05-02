import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      schedules: { orderBy: { taskName: "asc" } },
      serviceRecords: { orderBy: { date: "desc" } },
      mileageLogs: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { year, make, model, trim, color, vin, purchaseDate, mileage, photoUrl, notes } = body;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      year: Number(year),
      make,
      model,
      trim: trim || null,
      color: color || null,
      vin: vin || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      mileage: Number(mileage) || 0,
      photoUrl: photoUrl || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

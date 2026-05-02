import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SCHEDULES } from "@/lib/maintenance";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    include: { schedules: true },
    orderBy: { year: "asc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { year, make, model, trim, color, vin, purchaseDate, mileage, photoUrl, notes, applyDefaultSchedule } = body;

  const vehicle = await prisma.vehicle.create({
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
      schedules: applyDefaultSchedule !== false
        ? { create: DEFAULT_SCHEDULES }
        : undefined,
    },
    include: { schedules: true },
  });

  return NextResponse.json(vehicle, { status: 201 });
}

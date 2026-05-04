import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, recordId } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { taskName, date, mileage, cost, performedBy, shopName, notes } = body;

  const record = await prisma.serviceRecord.update({
    where: { id: recordId },
    data: {
      taskName,
      date: new Date(date),
      mileage: mileage ? Number(mileage) : null,
      cost: cost ? Number(cost) : null,
      performedBy,
      shopName: shopName || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, recordId } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.serviceRecord.delete({ where: { id: recordId } });
  return NextResponse.json({ ok: true });
}

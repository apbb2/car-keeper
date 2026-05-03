import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const docs = await prisma.document.findMany({
    where: { vehicleId: id, vehicle: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { type, name, fileUrl, notes } = body;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.document.create({
    data: { vehicleId: id, type, name, fileUrl: fileUrl || null, notes: notes || null },
  });
  return NextResponse.json(doc, { status: 201 });
}

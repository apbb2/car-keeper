import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docs = await prisma.document.findMany({
    where: { vehicleId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { type, name, fileUrl, notes } = body;

  const doc = await prisma.document.create({
    data: { vehicleId: id, type, name, fileUrl: fileUrl || null, notes: notes || null },
  });
  return NextResponse.json(doc, { status: 201 });
}

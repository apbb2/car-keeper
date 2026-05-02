import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;
  await prisma.document.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";
import VehicleForm from "@/components/VehicleForm";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return null;

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) notFound();
  return <VehicleForm vehicle={JSON.parse(JSON.stringify(vehicle))} />;
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase-server";
import VehicleDetail from "./VehicleDetail";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return null;

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: user.id },
    include: {
      schedules: { orderBy: { taskName: "asc" } },
      serviceRecords: { orderBy: { date: "desc" } },
      mileageLogs: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) notFound();
  return <VehicleDetail vehicle={JSON.parse(JSON.stringify(vehicle))} />;
}

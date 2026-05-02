import Link from "next/link";
import { Car, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeScheduleStatus, vehicleOverallStatus } from "@/lib/maintenance";
import StatusBadge from "@/components/StatusBadge";
import { formatMileage } from "@/lib/utils";

async function getVehicles() {
  return prisma.vehicle.findMany({
    include: { schedules: true },
    orderBy: [{ year: "asc" }, { make: "asc" }],
  });
}

export default async function GaragePage() {
  const vehicles = await getVehicles();

  return (
    <>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Garage</h1>
          <p className="text-sm text-zinc-500 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>

      <div className="page-content">
        {vehicles.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-700 mb-2">Your garage is empty</h2>
            <p className="text-sm text-zinc-400 mb-6">Add your first car to start tracking maintenance.</p>
            <Link href="/vehicles/new" className="btn-primary">Add Your First Vehicle</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => {
              const statuses = v.schedules.map((s) => computeScheduleStatus(s, v.mileage).status);
              const overall = vehicleOverallStatus(statuses);

              return (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="card hover:shadow-md transition-shadow group flex flex-col overflow-hidden">
                  <div className="h-44 bg-zinc-100 overflow-hidden flex items-center justify-center relative">
                    {v.photoUrl ? (
                      <img src={v.photoUrl} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Car className="w-16 h-16 text-zinc-300" />
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-bold text-zinc-900 leading-tight">{v.year} {v.make} {v.model}</p>
                        {v.trim && <p className="text-xs text-zinc-400">{v.trim}</p>}
                        {v.color && <p className="text-xs text-zinc-400">{v.color}</p>}
                      </div>
                      <StatusBadge status={overall} />
                    </div>
                    <p className="text-xs text-zinc-400 mt-auto pt-3">{formatMileage(v.mileage)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

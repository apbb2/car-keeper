import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_SCHEDULES } from "../src/lib/maintenance";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding sample vehicles...");

  const vehicles = [
    { year: 1965, make: "Ford", model: "Mustang", trim: "Fastback", color: "Candy Apple Red", vin: "5F07C123456", purchaseDate: new Date("2018-03-15"), mileage: 48200 },
    { year: 2002, make: "Ferrari", model: "360", trim: "Modena", color: "Rosso Corsa", purchaseDate: new Date("2020-06-01"), mileage: 22100 },
    { year: 1987, make: "Porsche", model: "911", trim: "Carrera", color: "Silver Metallic", purchaseDate: new Date("2015-09-20"), mileage: 61500 },
    { year: 1972, make: "Chevrolet", model: "Corvette", trim: "Stingray", color: "Bright Yellow", purchaseDate: new Date("2019-11-10"), mileage: 38900 },
  ];

  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.create({
      data: { ...v, schedules: { create: DEFAULT_SCHEDULES } },
    });

    // Add a few service records
    await prisma.serviceRecord.createMany({
      data: [
        { vehicleId: vehicle.id, taskName: "Engine Oil / Filter", date: new Date("2023-10-15"), mileage: v.mileage - 3000, cost: 85, performedBy: "DIY" },
        { vehicleId: vehicle.id, taskName: "State Registration", date: new Date("2025-01-20"), cost: 150, performedBy: "DIY" },
      ],
    });

    // Update schedule last done dates
    await prisma.maintenanceSchedule.updateMany({
      where: { vehicleId: vehicle.id, taskName: "Engine Oil / Filter" },
      data: { lastDoneDate: new Date("2023-10-15"), lastDoneMileage: v.mileage - 3000 },
    });
    await prisma.maintenanceSchedule.updateMany({
      where: { vehicleId: vehicle.id, taskName: "State Registration" },
      data: { lastDoneDate: new Date("2025-01-20") },
    });
    await prisma.maintenanceSchedule.updateMany({
      where: { vehicleId: vehicle.id, taskName: "Coolant / Antifreeze" },
      data: { lastDoneDate: new Date("2022-04-10") },
    });

    console.log(`  Created: ${v.year} ${v.make} ${v.model}`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

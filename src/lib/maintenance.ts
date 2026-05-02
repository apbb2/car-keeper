import { addMonths, isPast, differenceInDays } from "date-fns";
import type { MaintenanceSchedule } from "@/generated/prisma/client";

export type TaskStatus = "overdue" | "due-soon" | "good" | "never-done";

export interface ScheduleWithStatus extends MaintenanceSchedule {
  status: TaskStatus;
  nextDueDate: Date | null;
  nextDueMileage: number | null;
  daysUntilDue: number | null;
}

const DUE_SOON_DAYS = 60;
const DUE_SOON_MILES = 500;

export function computeScheduleStatus(
  schedule: MaintenanceSchedule,
  currentMileage: number
): ScheduleWithStatus {
  const { lastDoneDate, lastDoneMileage, intervalMonths, intervalMiles } = schedule;

  if (!lastDoneDate && !lastDoneMileage) {
    return { ...schedule, status: "never-done", nextDueDate: null, nextDueMileage: null, daysUntilDue: null };
  }

  let nextDueDate: Date | null = null;
  let nextDueMileage: number | null = null;
  let daysUntilDue: number | null = null;

  if (intervalMonths && lastDoneDate) {
    nextDueDate = addMonths(new Date(lastDoneDate), intervalMonths);
    daysUntilDue = differenceInDays(nextDueDate, new Date());
  }

  if (intervalMiles && lastDoneMileage != null) {
    nextDueMileage = lastDoneMileage + intervalMiles;
  }

  const dateOverdue = nextDueDate ? isPast(nextDueDate) : false;
  const mileageOverdue = nextDueMileage != null ? currentMileage >= nextDueMileage : false;

  if (dateOverdue || mileageOverdue) {
    return { ...schedule, status: "overdue", nextDueDate, nextDueMileage, daysUntilDue };
  }

  const dateDueSoon = nextDueDate ? daysUntilDue != null && daysUntilDue <= DUE_SOON_DAYS : false;
  const mileageDueSoon =
    nextDueMileage != null ? currentMileage >= nextDueMileage - DUE_SOON_MILES : false;

  if (dateDueSoon || mileageDueSoon) {
    return { ...schedule, status: "due-soon", nextDueDate, nextDueMileage, daysUntilDue };
  }

  return { ...schedule, status: "good", nextDueDate, nextDueMileage, daysUntilDue };
}

export function vehicleOverallStatus(statuses: TaskStatus[]): TaskStatus {
  if (statuses.includes("overdue") || statuses.includes("never-done")) return "overdue";
  if (statuses.includes("due-soon")) return "due-soon";
  return "good";
}

export const DEFAULT_SCHEDULES: { taskName: string; intervalMonths?: number; intervalMiles?: number }[] = [
  { taskName: "Engine Oil / Filter", intervalMonths: 18, intervalMiles: 5000 },
  { taskName: "State Registration", intervalMonths: 12 },
  { taskName: "Multipoint Mechanic Inspection", intervalMonths: 36 },
  { taskName: "Brake Fluid", intervalMonths: 60 },
  { taskName: "Coolant / Antifreeze", intervalMonths: 60 },
  { taskName: "Transmission / Differential Fluids", intervalMonths: 120 },
  { taskName: "Battery", intervalMonths: 36 },
  { taskName: "Tires", intervalMonths: 60, intervalMiles: 50000 },
  { taskName: "Detailing / Paint Protection", intervalMonths: 12 },
  { taskName: "Insurance Renewal", intervalMonths: 12 },
];

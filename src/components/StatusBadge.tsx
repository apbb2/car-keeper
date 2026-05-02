import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/maintenance";

const config: Record<TaskStatus, { label: string; classes: string }> = {
  overdue:    { label: "Overdue",   classes: "bg-red-100 text-red-700" },
  "never-done": { label: "Never Done", classes: "bg-red-100 text-red-700" },
  "due-soon": { label: "Due Soon",  classes: "bg-amber-100 text-amber-700" },
  good:       { label: "Good",      classes: "bg-green-100 text-green-700" },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, classes } = config[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", classes)}>
      {label}
    </span>
  );
}

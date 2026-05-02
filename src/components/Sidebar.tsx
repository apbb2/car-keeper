"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, PlusCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/garage", label: "My Garage", icon: Car },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-zinc-900 text-white h-full">
      <div className="px-5 py-6 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-lg tracking-tight">CarKeeper</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              path === href || (href === "/garage" && path.startsWith("/vehicles"))
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <Link
          href="/vehicles/new"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-zinc-800 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>
    </aside>
  );
}

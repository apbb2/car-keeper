import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarKeeper",
  description: "Car collection maintenance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full flex bg-zinc-50 antialiased">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

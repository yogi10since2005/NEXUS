"use client";

import { Sidebar } from "@/components/sidebar";
import { CommandCenter } from "@/components/command-center";

export default function NexusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050509] text-white">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Command Center */}
      <CommandCenter />

      {/* Page Content */}
      <div className="md:ml-[260px]">
        {children}
      </div>
    </main>
  );
}
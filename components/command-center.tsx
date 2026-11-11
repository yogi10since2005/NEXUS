"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Brain,
  CheckSquare,
  Code2,
  FileText,
  Gamepad2,
  Settings,
  Sparkles,
  Timer,
  Trophy,
  User,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const commands = [
  { name: "Dashboard", icon: Brain, section: "NAVIGATION" },
  { name: "AI Studio", icon: Brain, section: "AI" },
  { name: "Prompt Engineer", icon: Sparkles, section: "AI" },
  { name: "Tasks", icon: CheckSquare, section: "PRODUCTIVITY" },
  { name: "Focus", icon: Timer, section: "PRODUCTIVITY" },
  { name: "Notes", icon: FileText, section: "PRODUCTIVITY" },
  { name: "Developer Hub", icon: Code2, section: "TOOLS" },
  { name: "Mini Games", icon: Gamepad2, section: "TOOLS" },
  { name: "Achievements", icon: Trophy, section: "SYSTEM" },
  { name: "Analytics", icon: BarChart3, section: "SYSTEM" },
  { name: "Profile", icon: User, section: "ACCOUNT" },
  { name: "Settings", icon: Settings, section: "ACCOUNT" },
];

export function CommandCenter() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a11]/95 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Command className="bg-transparent text-white">
          <CommandInput
            placeholder="Search NEXUS..."
            className="h-14 border-none text-sm"
          />

          <CommandList className="max-h-[420px]">
            <CommandEmpty className="py-10 text-sm text-white/30">
              No command found.
            </CommandEmpty>

            {[
              "NAVIGATION",
              "AI",
              "PRODUCTIVITY",
              "TOOLS",
              "SYSTEM",
              "ACCOUNT",
            ].map((section) => {
              const sectionCommands = commands.filter(
                (command) => command.section === section
              );

              return (
                <CommandGroup
                  key={section}
                  heading={section}
                >
                  {sectionCommands.map((command) => {
                    const Icon = command.icon;

                    return (
                      <CommandItem
                        key={command.name}
                        value={command.name}
                        onSelect={() => setOpen(false)}
                        className="my-1 rounded-xl"
                      >
                        <Icon size={16} />

                        <span>{command.name}</span>

                        <span className="ml-auto text-white/20">
                          →
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>

          <div className="border-t border-white/[0.06] px-4 py-3 text-[10px] text-white/25">
            NEXUS COMMAND CENTER
            <span className="float-right">
              ESC to close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
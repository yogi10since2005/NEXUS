"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  Command,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Settings,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

const LOGO_KEY = "nexus-logo-hidden";

const mainNavigation = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
];

const productivityNavigation = [
  {
    name: "Prompt Engineer",
    icon: Sparkles,
    path: "/prompt-engineer",
  },
  {
    name: "Notes",
    icon: FileText,
    path: "/notes",
  },
];

const toolsNavigation = [
  {
    name: "Mini Games",
    icon: Gamepad2,
    path: "/mini-games",
  },
];

const systemNavigation = [
  {
    name: "Achievements",
    icon: Trophy,
    path: "/achievements",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [logoHidden, setLogoHidden] = useState(false);

  /* -------------------------------------------------------
     NEXUS LOGO SYNC
  ------------------------------------------------------- */

  useEffect(() => {
    const syncLogo = () => {
      const saved = localStorage.getItem(LOGO_KEY);
      setLogoHidden(saved === "true");
    };

    // Load current state
    syncLogo();

    // Listen for changes made from Settings
    window.addEventListener(
      "nexus-logo-change",
      syncLogo
    );

    // Also listen for changes from another browser tab
    window.addEventListener("storage", syncLogo);

    return () => {
      window.removeEventListener(
        "nexus-logo-change",
        syncLogo
      );

      window.removeEventListener("storage", syncLogo);
    };
  }, []);

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/[0.07] bg-[#07070c]/90 backdrop-blur-2xl">

      {/* -------------------------------------------------------
          LOGO
      ------------------------------------------------------- */}

      {!logoHidden && (
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-semibold shadow-[0_0_25px_rgba(139,92,246,0.12)]">
              N
            </div>

            <div>
              <div className="text-sm font-semibold tracking-[0.25em] text-white">
                NEXUS
              </div>

              <div className="text-[9px] tracking-[0.2em] text-white/30">
                COMMAND CENTER
              </div>
            </div>
          </button>

          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------
          NAVIGATION
      ------------------------------------------------------- */}

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <NavigationSection
          title="COMMAND"
          items={mainNavigation}
          pathname={pathname}
          onNavigate={navigate}
        />

        <NavigationSection
          title="PRODUCTIVITY"
          items={productivityNavigation}
          pathname={pathname}
          onNavigate={navigate}
        />

        <NavigationSection
          title="TOOLS"
          items={toolsNavigation}
          pathname={pathname}
          onNavigate={navigate}
        />

        <NavigationSection
          title="SYSTEM"
          items={systemNavigation}
          pathname={pathname}
          onNavigate={navigate}
        />

        {/* -------------------------------------------------------
            ACCOUNT
        ------------------------------------------------------- */}

        <div className="mt-8 border-t border-white/[0.06] pt-5">
          <p className="mb-3 px-3 text-[9px] font-medium tracking-[0.25em] text-white/25">
            ACCOUNT
          </p>

          <SidebarItem
            name="Profile"
            icon={User}
            path="/profile"
            pathname={pathname}
            onNavigate={navigate}
          />

          <SidebarItem
            name="Settings"
            icon={Settings}
            path="/settings"
            pathname={pathname}
            onNavigate={navigate}
          />
        </div>
      </div>

      {/* -------------------------------------------------------
          COMMAND CENTER
      ------------------------------------------------------- */}

      <div className="border-t border-white/[0.06] p-4">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
              })
            );
          }}
          className="group flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 transition hover:border-violet-400/20 hover:bg-white/[0.05]"
        >
          <div className="flex items-center gap-3">
            <Command
              size={15}
              className="text-violet-300/70"
            />

            <span className="text-xs text-white/50 group-hover:text-white/80">
              Command Center
            </span>
          </div>

          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/30">
            Ctrl K
          </span>
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------
   NAVIGATION SECTION
------------------------------------------------------- */

function NavigationSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: {
    name: string;
    icon: React.ElementType;
    path: string;
  }[];
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 px-3 text-[9px] font-medium tracking-[0.25em] text-white/25">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.name}
            name={item.name}
            icon={item.icon}
            path={item.path}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SIDEBAR ITEM
------------------------------------------------------- */

function SidebarItem({
  name,
  icon: Icon,
  path,
  pathname,
  onNavigate,
}: {
  name: string;
  icon: React.ElementType;
  path: string;
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  const active = pathname === path;

  return (
    <button
      type="button"
      onClick={() => onNavigate(path)}
      className={
        active
          ? "group flex w-full items-center gap-3 rounded-xl bg-white/[0.07] px-3 py-2.5 text-left text-white transition-all duration-200"
          : "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/45 transition-all duration-200 hover:bg-white/[0.055] hover:text-white/85"
      }
    >
      <Icon
        size={16}
        strokeWidth={1.7}
        className={
          active
            ? "text-violet-300 transition"
            : "text-white/30 transition group-hover:text-violet-300/80"
        }
      />

      <span className="text-xs">{name}</span>

      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.8)]" />
      )}
    </button>
  );
}
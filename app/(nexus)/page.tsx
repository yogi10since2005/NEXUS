
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";

import { createClient } from "@/lib/supabase/client";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  createdAt: string;
};

type DatabaseTask = {
  id: number;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  created_at: string;
};

const modules = [
  {
    title: "AI STUDIO",
    description: "Your multi-model AI workspace.",
    tag: "INTELLIGENCE",
    icon: Brain,
    path: "/ai-studio",
  },
  {
    title: "FOCUS",
    description: "Enter deep work mode and track your time.",
    tag: "PRODUCTIVITY",
    icon: Timer,
    path: "/focus",
  },
  {
    title: "TASKS",
    description: "Organize missions, priorities and daily goals.",
    tag: "MISSIONS",
    icon: CheckCircle2,
    path: "/tasks",
  },
  {
    title: "DEV HUB",
    description: "Your collection of powerful developer tools.",
    tag: "DEVELOPER",
    icon: Sparkles,
    path: "/developer-hub",
  },
];

const quickActions = [
  {
    title: "Start Focus",
    description: "Enter deep work mode",
    icon: Timer,
    path: "/focus",
  },
  {
    title: "New Task",
    description: "Add a mission",
    icon: Plus,
    path: "/tasks",
  },
  {
    title: "AI Studio",
    description: "Open AI workspace",
    icon: Brain,
    path: "/ai-studio",
  },
  {
    title: "New Note",
    description: "Capture an idea",
    icon: Sparkles,
    path: "/notes",
  },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setTasks([]);
      return;
    }

    const { data, error } = await supabase
      .from("nexus_tasks")
      .select("id, title, category, priority, completed, created_at")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Dashboard task loading failed:", error.message);
      return;
    }

    const formattedTasks: Task[] = ((data ?? []) as DatabaseTask[]).map(
      (task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        createdAt: task.created_at,
      })
    );

    setTasks(formattedTasks);
  }, []);

  useEffect(() => {
    loadTasks();

    const handleFocus = () => {
      loadTasks();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadTasks]);

  const completedTasks = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const taskCount = tasks.length;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050509] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[35%] top-[-220px] h-[500px] w-[650px] rounded-full bg-violet-600/[0.08] blur-[140px]" />
        <div className="absolute bottom-[-250px] left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />
        <div className="absolute right-[-180px] top-[35%] h-[450px] w-[450px] rounded-full bg-cyan-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10">
        {/* HEADER */}
        <header className="border-b border-white/[0.06] px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3 text-[10px] tracking-[0.3em] text-violet-300/60">
                <span className="h-px w-7 bg-violet-400/50" />
                NEXUS COMMAND CENTER
              </div>

              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Good to see you.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">
                Your personal workspace is ready. Stay focused, complete your
                missions and keep building.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-2.5 md:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] tracking-[0.2em] text-emerald-300/70">
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* STATS */}
        <section className="mx-auto grid max-w-[1500px] grid-cols-1 gap-3 px-6 pt-8 sm:grid-cols-2 xl:grid-cols-4 md:px-10">
          <StatCard
            label="TASKS TODAY"
            value={taskCount.toString().padStart(2, "0")}
            detail={completedTasks + " completed"}
            icon={<CheckCircle2 size={17} />}
          />
          <StatCard
            label="FOCUS TIME"
            value="02h 24m"
            detail="+18% this week"
            icon={<Clock3 size={17} />}
          />
          <StatCard
            label="CURRENT STREAK"
            value="07"
            detail="days active"
            icon={<Flame size={17} />}
          />
          <StatCard
            label="NEXUS XP"
            value="2,840"
            detail="Level 12"
            icon={<TrendingUp size={17} />}
          />
        </section>

        {/* MODULES */}
        <section className="mx-auto max-w-[1500px] px-6 pt-12 md:px-10">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-violet-400/50" />
              <p className="text-[10px] tracking-[0.3em] text-violet-300/60">
                NEXUS MODULES
              </p>
            </div>
            <p className="mt-3 text-sm text-white/30">
              Your core workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {modules.map(function (module) {
              const Icon = module.icon;

              return (
                <CardContainer
                  key={module.title}
                  className="w-full"
                  containerClassName="w-full py-0"
                >
                  <CardBody className="group/card relative min-h-[250px] w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-7 backdrop-blur-xl transition-colors duration-300 hover:border-violet-400/20 hover:bg-white/[0.045]">
                    <a href={module.path} className="block h-full w-full">
                      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/[0.08] blur-3xl transition-all duration-500 group-hover/card:bg-violet-400/[0.15]" />

                      <div className="relative z-10">
                        <CardItem
                          translateZ="40"
                          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
                        >
                          <Icon
                            size={21}
                            strokeWidth={1.5}
                            className="text-violet-300/70"
                          />
                        </CardItem>

                        <CardItem translateZ="55" className="mt-10">
                          <p className="text-[10px] tracking-[0.25em] text-violet-300/60">
                            {module.tag}
                          </p>
                        </CardItem>

                        <CardItem translateZ="70" className="mt-3">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            {module.title}
                          </h2>
                        </CardItem>

                        <CardItem translateZ="45" className="mt-3 max-w-md">
                          <p className="text-sm leading-6 text-white/35">
                            {module.description}
                          </p>
                        </CardItem>

                        <CardItem translateZ="35" className="mt-6">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition group-hover/card:border-violet-400/20 group-hover/card:text-white/80">
                            Open module
                            <ArrowUpRight size={13} />
                          </div>
                        </CardItem>
                      </div>
                    </a>
                  </CardBody>
                </CardContainer>
              );
            })}
          </div>
        </section>

        {/* TASKS + FOCUS */}
        <section className="mx-auto mt-10 grid max-w-[1500px] grid-cols-1 gap-5 px-6 xl:grid-cols-[1.4fr_0.8fr] md:px-10">
          {/* TASKS */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.25em] text-violet-300/60">
                  TODAY
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  Your missions
                </h2>
              </div>

              <a
                href="/tasks"
                className="flex items-center gap-1 text-[10px] text-white/30 transition hover:text-white/70"
              >
                VIEW ALL
                <ArrowUpRight size={13} />
              </a>
            </div>

            <div className="mt-6 space-y-2">
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
                  <Target size={23} className="mx-auto text-white/20" />
                  <p className="mt-3 text-sm text-white/35">
                    No missions yet.
                  </p>
                  <a
                    href="/tasks"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-white/45 transition hover:border-violet-400/20 hover:text-white/80"
                  >
                    <Plus size={13} />
                    CREATE TASK
                  </a>
                </div>
              ) : (
                tasks.slice(0, 4).map(function (task) {
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-black/10 px-4 py-3.5 transition hover:border-white/[0.09] hover:bg-white/[0.025]"
                    >
                      <div
                        className={
                          task.completed
                            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10"
                            : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15"
                        }
                      >
                        {task.completed && (
                          <CheckCircle2
                            size={13}
                            className="text-emerald-300"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            task.completed
                              ? "truncate text-sm text-white/25 line-through"
                              : "truncate text-sm text-white/75"
                          }
                        >
                          {task.title}
                        </p>
                        <p className="mt-1 text-[9px] tracking-[0.18em] text-white/20">
                          {task.category}
                        </p>
                      </div>

                      <span
                        className={
                          task.priority === "HIGH"
                            ? "hidden rounded-full border border-red-400/20 bg-red-400/[0.05] px-2 py-1 text-[8px] tracking-[0.15em] text-red-300/60 sm:block"
                            : task.priority === "MEDIUM"
                              ? "hidden rounded-full border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-[8px] tracking-[0.15em] text-amber-300/60 sm:block"
                              : "hidden rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[8px] tracking-[0.15em] text-white/25 sm:block"
                        }
                      >
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FOCUS */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-400/[0.12] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.12] blur-[70px]" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-violet-300/60">
                    DEEP WORK
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Focus session
                  </h2>
                </div>
                <Target size={18} className="text-violet-300/60" />
              </div>

              <div className="mt-10 flex justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-violet-300/10">
                  <div className="absolute inset-3 rounded-full border border-violet-300/[0.07]" />
                  <div className="text-center">
                    <p className="text-3xl font-semibold">25:00</p>
                    <p className="mt-1 text-[9px] tracking-[0.2em] text-white/25">
                      READY
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="/focus"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[0.08] py-3 text-xs text-violet-200/80 transition hover:bg-violet-400/[0.14]"
              >
                <Timer size={14} />
                START FOCUS
              </a>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mx-auto mt-10 max-w-[1500px] px-6 md:px-10">
          <p className="mb-5 text-[9px] tracking-[0.25em] text-white/25">
            QUICK ACTIONS
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(function (action) {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.path}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/20 hover:bg-white/[0.045]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                    <Icon
                      size={17}
                      className="text-white/40 transition group-hover:text-violet-300/80"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/70 group-hover:text-white">
                      {action.title}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-white/25">
                      {action.description}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={14}
                    className="ml-auto text-white/15 transition group-hover:text-white/50"
                  />
                </a>
              );
            })}
          </div>
        </section>

        {/* AI ACTIVITY + PRODUCTIVITY */}
        <section className="mx-auto mt-10 grid max-w-[1500px] grid-cols-1 gap-5 px-6 lg:grid-cols-2 md:px-10">
          {/* AI Activity */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-violet-300/70" />
              <div>
                <p className="text-[9px] tracking-[0.25em] text-violet-300/60">
                  AI ACTIVITY
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Recent prompts
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <ActivityItem
                number="01"
                text="Build a React authentication system"
              />
              <ActivityItem
                number="02"
                text="Explain database normalization"
              />
              <ActivityItem
                number="03"
                text="Improve my project presentation"
              />
            </div>
          </div>

          {/* Productivity */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-cyan-300/60" />
              <div>
                <p className="text-[9px] tracking-[0.25em] text-cyan-300/50">
                  PRODUCTIVITY
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Weekly overview
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <ProgressRow
                label="Tasks completed"
                detail="18 / 25"
                percentage="72%"
              />
              <ProgressRow
                label="Focus sessions"
                detail="16 sessions"
                percentage="64%"
              />
              <ProgressRow
                label="Daily consistency"
                detail="6 / 7 days"
                percentage="84%"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mx-auto mt-12 max-w-[1500px] border-t border-white/[0.06] px-6 py-6 text-center text-[9px] tracking-[0.2em] text-white/15 md:px-10">
          NEXUS CORE • PERSONAL COMMAND CENTER
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl transition hover:border-violet-400/20 hover:bg-white/[0.04]">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[9px] tracking-[0.25em] text-white/25">
            {label}
          </p>
          <p className="mt-4 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-[11px] text-white/30">{detail}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-violet-300/70">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/10 px-4 py-3">
      <span className="text-[10px] text-white/20">{number}</span>
      <p className="truncate text-xs text-white/45">{text}</p>
      <ArrowUpRight size={13} className="ml-auto shrink-0 text-white/15" />
    </div>
  );
}

function ProgressRow({
  label,
  detail,
  percentage,
}: {
  label: string;
  detail: string;
  percentage: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-white/45">{label}</span>
        <span className="text-[10px] text-white/25">{detail}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-violet-400/60"
          style={{ width: percentage }}
        />
      </div>
    </div>
  );
}
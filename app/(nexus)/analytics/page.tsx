
"use client";

import { useEffect, useMemo, useState } from "react";

const TASKS_KEY = "nexus-tasks";
const ANALYTICS_KEY = "nexus-analytics-v1";
const FOCUS_KEYS = ["nexus-focus-sessions", "nexus-focus-history"];

type Task = {
  id?: string | number;
  title?: string;
  completed?: boolean;
  isCompleted?: boolean;
  status?: string;
  createdAt?: string;
  completedAt?: string;
  updatedAt?: string;
};

type DayData = {
  label: string;
  date: string;
  tasks: number;
  focus: number;
  games: number;
};

function readJSON(key: string, fallback: unknown): any {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getTasks(): Task[] {
  const data = readJSON(TASKS_KEY, []);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function isTaskCompleted(task: Task) {
  return (
    task.completed === true ||
    task.isCompleted === true ||
    task.status?.toLowerCase() === "completed" ||
    task.status?.toLowerCase() === "done"
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getLastSevenDays(): DayData[] {
  const tasks = getTasks();
  const focusData = FOCUS_KEYS.flatMap((key) => {
    const data = readJSON(key, []);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.sessions)) return data.sessions;
    if (Array.isArray(data?.history)) return data.history;
    return [];
  });

  const gamesData = readJSON("nexus-game-high-scores-v1", {});
  const days: DayData[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const key = dateKey(date);

    const tasksForDay = tasks.filter((task) => {
      const completedDate = task.completedAt || task.updatedAt;
      return (
        isTaskCompleted(task) &&
        typeof completedDate === "string" &&
        dateKey(new Date(completedDate)) === key
      );
    }).length;

    const focusForDay = focusData.filter((session: any) => {
      const sessionDate =
        session.completedAt || session.date || session.createdAt || session.timestamp;
      if (!sessionDate) return false;
      const parsed = new Date(sessionDate);
      return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === key;
    }).length;

    const gamesForDay = Array.isArray(gamesData?.history)
      ? gamesData.history.filter((game: any) => {
          const gameDate = game.date || game.createdAt || game.timestamp;
          if (!gameDate) return false;
          const parsed = new Date(gameDate);
          return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === key;
        }).length
      : 0;

    days.push({
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: key,
      tasks: tasksForDay,
      focus: focusForDay,
      games: gamesForDay,
    });
  }

  return days;
}

function StatCard({
  label,
  value,
  suffix,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 transition hover:border-violet-400/30 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
          {icon}
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </span>
        {suffix && <span className="text-sm text-white/40">{suffix}</span>}
      </div>
      <p className="mt-2 text-xs text-white/35">{detail}</p>
    </div>
  );
}

function BarChart({
  days,
  metric,
}: {
  days: DayData[];
  metric: "tasks" | "focus" | "games";
}) {
  const maximum = Math.max(1, ...days.map((day) => day[metric]));

  return (
    <div className="flex h-56 items-end justify-between gap-2 sm:gap-4">
      {days.map((day) => {
        const value = day[metric];
        const height = value === 0 ? 4 : Math.max(8, (value / maximum) * 100);

        return (
          <div
            key={day.date}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
          >
            <div className="relative flex h-full w-full items-end justify-center">
              <div className="absolute bottom-0 h-full w-full max-w-12 rounded-t-lg bg-white/[0.025]" />
              <div
                title={`${day.label}: ${value}`}
                className="relative w-full max-w-12 rounded-t-lg bg-gradient-to-t from-violet-600 to-cyan-400 transition-all duration-500 group-hover:brightness-125"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[11px] text-white/40">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({
  completed,
  remaining,
}: {
  completed: number;
  remaining: number;
}) {
  const total = completed + remaining;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#a78bfa ${percentage}%, rgba(255,255,255,0.08) ${percentage}% 100%)`,
        }}
      />
      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full border border-white/[0.06] bg-[#0b0b18]">
        <span className="text-3xl font-bold">{percentage}%</span>
        <span className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
          Complete
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<DayData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshTime, setRefreshTime] = useState("");

  const refresh = () => {
    setTasks(getTasks());
    setDays(getLastSevenDays());
    setRefreshTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  useEffect(() => {
    refresh();

    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  const completedTasks = tasks.filter(isTaskCompleted).length;
  const pendingTasks = Math.max(0, tasks.length - completedTasks);
  const completionRate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const weeklyTasks = days.reduce((sum, day) => sum + day.tasks, 0);
  const weeklyFocus = days.reduce((sum, day) => sum + day.focus, 0);
  const weeklyGames = days.reduce((sum, day) => sum + day.games, 0);

  const bestDay = useMemo(() => {
    if (!days.length) return null;
    return days.reduce((best, day) => {
      const score = day.tasks + day.focus + day.games;
      const bestScore = best.tasks + best.focus + best.games;
      return score > bestScore ? day : best;
    }, days[0]);
  }, [days]);

  const [metric, setMetric] = useState<"tasks" | "focus" | "games">("tasks");

  const metricLabel = {
    tasks: "Tasks completed",
    focus: "Focus sessions",
    games: "Gaming activity",
  }[metric];

  return (
    <main className="min-h-screen bg-[#070711] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              NEXUS CORE / INTELLIGENCE
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Analytics<span className="text-cyan-400">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
              Understand your habits, track your momentum, and turn your
              activity into measurable progress.
            </p>
          </div>

          <button
            onClick={refresh}
            className="w-fit rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
          >
            ↻ Refresh data
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/35">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Local analytics
          {refreshTime && <span>· Updated at {refreshTime}</span>}
          <span>· Last 7 calendar days</span>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tasks completed"
            value={completedTasks}
            detail={`${pendingTasks} tasks still pending`}
            icon="✓"
          />
          <StatCard
            label="Completion rate"
            value={completionRate}
            suffix="%"
            detail="Based on saved tasks"
            icon="◉"
          />
          <StatCard
            label="Focus sessions"
            value={weeklyFocus}
            detail="Sessions detected this week"
            icon="◷"
          />
          <StatCard
            label="Games played"
            value={weeklyGames}
            detail="Recorded activity this week"
            icon="⌘"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Activity overview</h2>
                <p className="mt-1 text-sm text-white/40">
                  Daily activity across the last seven calendar days
                </p>
              </div>
              <select
                value={metric}
                onChange={(event) =>
                  setMetric(event.target.value as typeof metric)
                }
                className="rounded-xl border border-white/10 bg-[#10101d] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50"
              >
                <option value="tasks">Tasks</option>
                <option value="focus">Focus sessions</option>
                <option value="games">Games</option>
              </select>
            </div>

            <div className="mt-8">
              <BarChart days={days} metric={metric} />
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              {metricLabel}
              <span className="ml-auto">Total: {days.reduce((sum, day) => sum + day[metric], 0)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Task completion</h2>
            <p className="mt-1 text-sm text-white/40">
              Your current saved task breakdown
            </p>

            <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row xl:flex-col">
              <Donut completed={completedTasks} remaining={pendingTasks} />

              <div className="w-full flex-1 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                    <span className="text-sm text-white/60">Completed</span>
                  </div>
                  <span className="text-sm font-semibold">{completedTasks}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="text-sm text-white/60">Remaining</span>
                  </div>
                  <span className="text-sm font-semibold">{pendingTasks}</span>
                </div>
                <div className="h-px bg-white/[0.08]" />
                <p className="text-xs leading-5 text-white/35">
                  {tasks.length === 0
                    ? "Create tasks in NEXUS to start tracking your completion rate."
                    : completionRate >= 80
                    ? "Excellent progress. You have completed most of your saved tasks."
                    : completionRate >= 50
                    ? "Good momentum. Keep working through your remaining tasks."
                    : "Start with one small task and build your momentum."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Weekly summary</h2>
                <p className="mt-1 text-sm text-white/40">
                  Activity found in local browser data
                </p>
              </div>
              <span className="text-2xl">◈</span>
            </div>

            <div className="mt-6 space-y-5">
              {[
                {
                  label: "Tasks completed",
                  value: weeklyTasks,
                  color: "from-violet-500 to-violet-300",
                },
                {
                  label: "Focus sessions",
                  value: weeklyFocus,
                  color: "from-cyan-500 to-cyan-300",
                },
                {
                  label: "Gaming activity",
                  value: weeklyGames,
                  color: "from-fuchsia-500 to-violet-300",
                },
              ].map((item) => {
                const maximum = Math.max(
                  1,
                  weeklyTasks,
                  weeklyFocus,
                  weeklyGames
                );

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-white/55">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                        style={{
                          width: `${(item.value / maximum) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.10] via-white/[0.025] to-cyan-500/[0.06] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                Insight engine
              </p>
              <h2 className="mt-4 text-2xl font-bold">
                {tasks.length === 0
                  ? "Your journey starts here."
                  : completionRate >= 80
                  ? "You're building momentum."
                  : completionRate >= 50
                  ? "Keep the momentum going."
                  : "Small steps. Real progress."}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
                {tasks.length === 0
                  ? "Add tasks and use your Focus tools. Analytics will reflect the activity that your NEXUS modules save."
                  : `${completedTasks} of ${tasks.length} saved tasks are complete. You have ${pendingTasks} remaining. Use your task list to decide what to tackle next.`}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-xs text-white/40">Best recorded day</p>
                  <p className="mt-2 font-semibold">
                    {bestDay &&
                    bestDay.tasks + bestDay.focus + bestDay.games > 0
                      ? bestDay.label
                      : "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-xs text-white/40">Tracked tasks</p>
                  <p className="mt-2 font-semibold">{tasks.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.08] pt-5 text-center text-[10px] tracking-[0.25em] text-white/25">
          NEXUS CORE • PERSONAL COMMAND CENTER
        </footer>
      </div>
    </main>
  );
}
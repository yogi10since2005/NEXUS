
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nexus-achievements-v1";
const EVENT_NAME = "nexus:achievement-event";

type Stats = {
  gamesPlayed: number;
  gamesWon: number;
  highScores: number;
  uniqueGames: string[];
  tasksCompleted: number;
  notesCreated: number;
  focusSessions: number;
};

type SavedData = {
  unlocked: string[];
  stats: Stats;
  xp: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  category: string;
  xp: number;
  icon: string;
  check: (stats: Stats) => boolean;
};

const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  highScores: 0,
  uniqueGames: [],
  tasksCompleted: 0,
  notesCreated: 0,
  focusSessions: 0,
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-game",
    title: "Player One",
    description: "Play your first game in Gaming Hub.",
    category: "Gaming",
    xp: 50,
    icon: "🎮",
    check: (s) => s.gamesPlayed >= 1,
  },
  {
    id: "five-games",
    title: "Getting Started",
    description: "Play 5 games.",
    category: "Gaming",
    xp: 75,
    icon: "🕹️",
    check: (s) => s.gamesPlayed >= 5,
  },
  {
    id: "ten-games",
    title: "Dedicated Gamer",
    description: "Play 10 games.",
    category: "Gaming",
    xp: 100,
    icon: "🎯",
    check: (s) => s.gamesPlayed >= 10,
  },
  {
    id: "twenty-five-games",
    title: "Game Enthusiast",
    description: "Play 25 games.",
    category: "Gaming",
    xp: 150,
    icon: "🏆",
    check: (s) => s.gamesPlayed >= 25,
  },
  {
    id: "first-win",
    title: "First Victory",
    description: "Win your first game.",
    category: "Gaming",
    xp: 75,
    icon: "🥇",
    check: (s) => s.gamesWon >= 1,
  },
  {
    id: "five-wins",
    title: "Winner's Circle",
    description: "Win 5 games.",
    category: "Gaming",
    xp: 125,
    icon: "🏅",
    check: (s) => s.gamesWon >= 5,
  },
  {
    id: "ten-wins",
    title: "Unstoppable",
    description: "Win 10 games.",
    category: "Gaming",
    xp: 200,
    icon: "⚡",
    check: (s) => s.gamesWon >= 10,
  },
  {
    id: "first-record",
    title: "Record Breaker",
    description: "Set your first personal best.",
    category: "Gaming",
    xp: 100,
    icon: "📈",
    check: (s) => s.highScores >= 1,
  },
  {
    id: "three-games",
    title: "Explorer",
    description: "Try 3 different games.",
    category: "Gaming",
    xp: 100,
    icon: "🧭",
    check: (s) => s.uniqueGames.length >= 3,
  },
  {
    id: "five-different-games",
    title: "Gaming Explorer",
    description: "Try 5 different games.",
    category: "Gaming",
    xp: 150,
    icon: "🌌",
    check: (s) => s.uniqueGames.length >= 5,
  },
  {
    id: "first-task",
    title: "Task Taker",
    description: "Complete your first task.",
    category: "Productivity",
    xp: 50,
    icon: "✅",
    check: (s) => s.tasksCompleted >= 1,
  },
  {
    id: "ten-tasks",
    title: "Getting Things Done",
    description: "Complete 10 tasks.",
    category: "Productivity",
    xp: 150,
    icon: "🚀",
    check: (s) => s.tasksCompleted >= 10,
  },
  {
    id: "first-note",
    title: "Thought Collector",
    description: "Create your first note.",
    category: "Productivity",
    xp: 50,
    icon: "📝",
    check: (s) => s.notesCreated >= 1,
  },
  {
    id: "ten-notes",
    title: "Knowledge Keeper",
    description: "Create 10 notes.",
    category: "Productivity",
    xp: 125,
    icon: "📚",
    check: (s) => s.notesCreated >= 10,
  },
  {
    id: "first-focus",
    title: "Focus Initiated",
    description: "Complete your first focus session.",
    category: "Focus",
    xp: 75,
    icon: "🎧",
    check: (s) => s.focusSessions >= 1,
  },
  {
    id: "five-focus",
    title: "Deep Work",
    description: "Complete 5 focus sessions.",
    category: "Focus",
    xp: 150,
    icon: "🧠",
    check: (s) => s.focusSessions >= 5,
  },
  {
    id: "ten-focus",
    title: "Flow State",
    description: "Complete 10 focus sessions.",
    category: "Focus",
    xp: 250,
    icon: "✨",
    check: (s) => s.focusSessions >= 10,
  },
  {
    id: "level-five",
    title: "Leveling Up",
    description: "Earn 500 achievement XP.",
    category: "Milestones",
    xp: 100,
    icon: "⬆️",
    check: () => false,
  },
  {
    id: "level-ten",
    title: "Elite Status",
    description: "Earn 1,000 achievement XP.",
    category: "Milestones",
    xp: 200,
    icon: "💎",
    check: () => false,
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Unlock every other achievement.",
    category: "Milestones",
    xp: 500,
    icon: "👑",
    check: () => false,
  },
];

function readSaved(): SavedData {
  const fallback: SavedData = {
    unlocked: [],
    stats: { ...EMPTY_STATS, uniqueGames: [] },
    xp: 0,
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const oldStats = parsed.stats ?? {};

    return {
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      stats: {
        ...EMPTY_STATS,
        ...oldStats,
        uniqueGames: Array.isArray(oldStats.uniqueGames)
          ? oldStats.uniqueGames
          : [],
      },
      xp: Number(parsed.xp) || 0,
    };
  } catch {
    return fallback;
  }
}

function saveData(data: SavedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("NEXUS could not save achievements:", error);
  }
}

function normalizeGameId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toLowerCase();
  }
  return null;
}

function updateStatsFromEvent(
  current: Stats,
  detail: Record<string, unknown>
): Stats {
  const next: Stats = {
    ...current,
    uniqueGames: [...current.uniqueGames],
  };

  const rawType = String(
    detail.type ?? detail.event ?? detail.action ?? ""
  ).toLowerCase();

  const gameId = normalizeGameId(
    detail.gameId ?? detail.game ?? detail.gameName
  );

  if (
    rawType.includes("game_played") ||
    rawType.includes("game-played") ||
    rawType === "play" ||
    rawType === "game_play"
  ) {
    next.gamesPlayed += 1;
    if (gameId && !next.uniqueGames.includes(gameId)) {
      next.uniqueGames.push(gameId);
    }
  }

  if (
    rawType.includes("game_won") ||
    rawType.includes("game-won") ||
    rawType === "win"
  ) {
    next.gamesWon += 1;
    if (gameId && !next.uniqueGames.includes(gameId)) {
      next.uniqueGames.push(gameId);
    }
  }

  if (
    rawType.includes("high_score") ||
    rawType.includes("high-score") ||
    rawType === "personal_best"
  ) {
    next.highScores += 1;
    if (gameId && !next.uniqueGames.includes(gameId)) {
      next.uniqueGames.push(gameId);
    }
  }

  if (
    rawType.includes("task_completed") ||
    rawType.includes("task-completed")
  ) {
    next.tasksCompleted += 1;
  }

  if (
    rawType.includes("note_created") ||
    rawType.includes("note-created")
  ) {
    next.notesCreated += 1;
  }

  if (
    rawType.includes("focus_completed") ||
    rawType.includes("focus-completed")
  ) {
    next.focusSessions += 1;
  }

  return next;
}

function processAchievements(
  input: SavedData,
  incomingStats?: Stats
): { data: SavedData; newlyUnlocked: Achievement[] } {
  const stats = incomingStats ?? input.stats;
  const unlocked = new Set(input.unlocked);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (
      achievement.id !== "completionist" &&
      achievement.id !== "level-five" &&
      achievement.id !== "level-ten" &&
      achievement.check(stats) &&
      !unlocked.has(achievement.id)
    ) {
      unlocked.add(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  const xpBeforeMeta = input.xp + newlyUnlocked.reduce(
    (sum, achievement) => sum + achievement.xp,
    0
  );

  const metaStats: Stats = { ...stats };

  if (xpBeforeMeta >= 500 && !unlocked.has("level-five")) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === "level-five")!;
    unlocked.add(achievement.id);
    newlyUnlocked.push(achievement);
  }

  const xpAfterLevelFive = xpBeforeMeta +
    (newlyUnlocked.some((a) => a.id === "level-five")
      ? ACHIEVEMENTS.find((a) => a.id === "level-five")!.xp
      : 0);

  if (xpAfterLevelFive >= 1000 && !unlocked.has("level-ten")) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === "level-ten")!;
    unlocked.add(achievement.id);
    newlyUnlocked.push(achievement);
  }

  const regularAchievementCount = ACHIEVEMENTS.filter(
    (a) => a.id !== "completionist"
  ).length;

  if (
    unlocked.size >= regularAchievementCount &&
    !unlocked.has("completionist")
  ) {
    const achievement = ACHIEVEMENTS.find(
      (a) => a.id === "completionist"
    )!;
    unlocked.add(achievement.id);
    newlyUnlocked.push(achievement);
  }

  const data: SavedData = {
    unlocked: Array.from(unlocked),
    stats: metaStats,
    xp: input.xp + newlyUnlocked.reduce(
      (sum, achievement) => sum + achievement.xp,
      0
    ),
  };

  return { data, newlyUnlocked };
}

export default function AchievementsPage() {
  const [saved, setSaved] = useState<SavedData>({
    unlocked: [],
    stats: { ...EMPTY_STATS, uniqueGames: [] },
    xp: 0,
  });
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState("");

  const syncAchievements = useCallback(
    (incomingStats?: Stats, eventDetail?: Record<string, unknown>) => {
      const current = readSaved();

      const base: SavedData = {
        ...current,
        stats: incomingStats ?? current.stats,
      };

      const result = processAchievements(base, incomingStats);
      saveData(result.data);
      setSaved(result.data);

      if (result.newlyUnlocked.length > 0) {
        setToast(
          `Achievement unlocked: ${result.newlyUnlocked[0].title} (+${result.newlyUnlocked[0].xp} XP)`
        );
      } else if (eventDetail) {
        setToast("");
      }
    },
    []
  );

  useEffect(() => {
    const current = readSaved();
    const result = processAchievements(current);
    saveData(result.data);
    setSaved(result.data);
    setReady(true);

    const handleAchievementEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;

      if (!detail || typeof detail !== "object") return;

      const latest = readSaved();
      const nextStats = updateStatsFromEvent(
        latest.stats,
        detail as Record<string, unknown>
      );

      syncAchievements(nextStats, detail as Record<string, unknown>);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setSaved(readSaved());
      }
    };

    window.addEventListener(EVENT_NAME, handleAchievementEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleAchievementEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncAchievements]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const unlockedSet = useMemo(
    () => new Set(saved.unlocked),
    [saved.unlocked]
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(ACHIEVEMENTS.map((a) => a.category)))],
    []
  );

  const visibleAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(
      (achievement) =>
        category === "All" || achievement.category === category
    );
  }, [category]);

  const unlockedCount = saved.unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  const resetAchievements = () => {
    const confirmed = window.confirm(
      "Reset all achievement progress? This cannot be undone."
    );
    if (!confirmed) return;

    const reset: SavedData = {
      unlocked: [],
      stats: { ...EMPTY_STATS, uniqueGames: [] },
      xp: 0,
    };

    saveData(reset);
    setSaved(reset);
    setToast("Achievement progress reset.");
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#070711] p-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-white/10" />
          <div className="mt-6 h-40 rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070711] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
              NEXUS CORE / PROGRESSION
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Achievements<span className="text-violet-400">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
              Every session counts. Complete challenges, collect XP, and
              build your personal legacy.
            </p>
          </div>

          <button
            onClick={resetAchievements}
            className="w-fit rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:border-red-400/40 hover:text-red-300"
          >
            Reset progress
          </button>
        </header>

        {toast && (
          <div
            role="status"
            className="rounded-2xl border border-violet-400/30 bg-violet-500/10 px-5 py-4 text-sm text-violet-100 shadow-lg shadow-violet-950/20"
          >
            <span className="mr-2">✦</span>
            {toast}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Total XP</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {saved.xp.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-violet-300">Experience earned</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Unlocked</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {unlockedCount}
              <span className="ml-1 text-lg font-medium text-white/30">
                / {totalCount}
              </span>
            </p>
            <p className="mt-2 text-xs text-emerald-300">Achievements earned</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Completion</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">{progress}%</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Current activity</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {saved.stats.gamesPlayed}
            </p>
            <p className="mt-2 text-xs text-cyan-300">
              Games played
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your progression</h2>
              <p className="mt-1 text-sm text-white/40">
                Unlock achievements to earn experience points.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${
                    category === item
                      ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                      : "border border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Achievement collection</h2>
            <p className="text-sm text-white/40">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleAchievements.map((achievement) => {
              const isUnlocked = unlockedSet.has(achievement.id);

              return (
                <article
                  key={achievement.id}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    isUnlocked
                      ? "border-violet-400/30 bg-gradient-to-br from-violet-500/[0.12] to-cyan-500/[0.04] shadow-lg shadow-violet-950/10"
                      : "border-white/[0.08] bg-white/[0.025] opacity-75 hover:border-white/20 hover:opacity-100"
                  }`}
                >
                  {isUnlocked && (
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
                  )}

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                        isUnlocked
                          ? "border border-violet-300/20 bg-violet-500/15"
                          : "border border-white/10 bg-white/5 grayscale"
                      }`}
                    >
                      {isUnlocked ? achievement.icon : "🔒"}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border border-white/10 bg-white/5 text-white/35"
                      }`}
                    >
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>

                  <div className="relative mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/70">
                      {achievement.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      {achievement.title}
                    </h3>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-white/45">
                      {achievement.description}
                    </p>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
                    <span className="text-xs text-white/35">
                      {isUnlocked ? "Reward claimed" : "Reward"}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isUnlocked ? "text-cyan-300" : "text-white/50"
                      }`}
                    >
                      +{achievement.xp} XP
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.05] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Activity statistics
          </p>
          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Games played", saved.stats.gamesPlayed],
              ["Games won", saved.stats.gamesWon],
              ["Personal bests", saved.stats.highScores],
              ["Different games", saved.stats.uniqueGames.length],
              ["Tasks completed", saved.stats.tasksCompleted],
              ["Focus sessions", saved.stats.focusSessions],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="mt-1 text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/[0.08] pt-5 text-center text-[10px] tracking-[0.25em] text-white/25">
          NEXUS CORE • PERSONAL COMMAND CENTER
        </footer>
      </div>
    </main>
  );
}
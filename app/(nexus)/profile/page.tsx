"use client";

import {
  Activity,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clipboard,
  Clock3,
  Copy,
  FileText,
  Flame,
  Gamepad2,
  LayoutDashboard,
  Pencil,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  createdAt?: string;
};

type Note = {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Profile = {
  name: string;
  username: string;
  role: string;
  bio: string;
  avatar: string;
};

const PROFILE_KEY = "nexus-profile";
const TASKS_KEY = "nexus-tasks";
const NOTES_KEY = "nexus-notes";

const defaultProfile: Profile = {
  name: "Yogi",
  username: "yogi",
  role: "NEXUS User",
  bio: "Building, learning and exploring.",
  avatar: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draft, setDraft] = useState<Profile>(defaultProfile);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [activeAchievement, setActiveAchievement] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadData();

    const handleStorage = () => {
      loadData();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("nexus-profile-change", handleStorage);
    window.addEventListener("nexus-tasks-change", handleStorage);
    window.addEventListener("nexus-notes-change", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nexus-profile-change", handleStorage);
      window.removeEventListener("nexus-tasks-change", handleStorage);
      window.removeEventListener("nexus-notes-change", handleStorage);
    };
  }, []);

  function loadData() {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);

        if (parsed && typeof parsed === "object") {
          const nextProfile = {
            ...defaultProfile,
            ...parsed,
          };

          setProfile(nextProfile);
          setDraft(nextProfile);
        }
      }

      const savedTasks = localStorage.getItem(TASKS_KEY);

      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);

        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks);
        }
      }

      const savedNotes = localStorage.getItem(NOTES_KEY);

      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);

        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes);
        }
      }
    } catch {
      console.error("Failed to load NEXUS profile data.");
    }
  }

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const totalTasks = tasks.length;

  const totalNotes = notes.length;

  /*
   * XP system
   *
   * Completed task = 25 XP
   * Created note = 10 XP
   * Base XP = 100
   */
  const xp = useMemo(() => {
    const calculatedXP =
      100 + completedTasks * 25 + totalNotes * 10;

    return calculatedXP;
  }, [completedTasks, totalNotes]);

  const level = Math.max(1, Math.floor(xp / 250) + 1);

  const currentLevelXP = xp % 250;
  const nextLevelXP = 250;

  const xpProgress = Math.min(
    100,
    Math.round((currentLevelXP / nextLevelXP) * 100),
  );

  const streak = useMemo(() => {
    if (completedTasks === 0) return 0;

    /*
     * We keep this conservative because local task data
     * does not necessarily contain daily activity history.
     */
    return Math.min(7, Math.max(1, Math.ceil(completedTasks / 3)));
  }, [completedTasks]);

  const achievements = useMemo(() => {
    return [
      {
        id: "first-task",
        icon: CheckCircle2,
        title: "First Task",
        description: "Complete your first task.",
        unlocked: completedTasks >= 1,
      },
      {
        id: "note-master",
        icon: FileText,
        title: "Note Creator",
        description: "Create your first note.",
        unlocked: totalNotes >= 1,
      },
      {
        id: "task-master",
        icon: Target,
        title: "Task Master",
        description: "Complete 10 tasks.",
        unlocked: completedTasks >= 10,
      },
      {
        id: "streak",
        icon: Flame,
        title: "7 Day Streak",
        description: "Build a seven-day activity streak.",
        unlocked: streak >= 7,
      },
      {
        id: "level-ten",
        icon: Trophy,
        title: "Level 10",
        description: "Reach NEXUS level 10.",
        unlocked: level >= 10,
      },
      {
        id: "ai-explorer",
        icon: Sparkles,
        title: "AI Explorer",
        description: "Unlock the NEXUS AI Core.",
        unlocked: false,
      },
    ];
  }, [completedTasks, totalNotes, streak, level]);

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  const achievementProgress = Math.round(
    (unlockedAchievements / achievements.length) * 100,
  );

  const activity = useMemo(() => {
    const items: {
      id: string;
      type: "task" | "note";
      title: string;
      date: string;
      icon: typeof CheckCircle2;
    }[] = [];

    tasks
      .filter((task) => task.completed)
      .slice()
      .reverse()
      .slice(0, 5)
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          type: "task",
          title: `Completed "${task.title}"`,
          date: task.createdAt || "",
          icon: CheckCircle2,
        });
      });

    notes
      .slice()
      .reverse()
      .slice(0, 5)
      .forEach((note) => {
        items.push({
          id: `note-${note.id}`,
          type: "note",
          title: `Created "${note.title || "Untitled Note"}"`,
          date: note.createdAt || note.updatedAt || "",
          icon: FileText,
        });
      });

    return items
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [tasks, notes]);

  function formatDate(value: string) {
    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const now = Date.now();
    const difference = now - date.getTime();

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) return "Just now";
    if (difference < hour) {
      return `${Math.floor(difference / minute)} min ago`;
    }

    if (difference < day) {
      return `${Math.floor(difference / hour)} hr ago`;
    }

    if (difference < 7 * day) {
      return `${Math.floor(difference / day)} days ago`;
    }

    return date.toLocaleDateString();
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setAvatarError("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setDraft((current) => ({
          ...current,
          avatar: result,
        }));
      }
    };

    reader.readAsDataURL(file);
  }

  function saveProfile() {
    const cleanProfile: Profile = {
      name: draft.name.trim() || "Yogi",
      username:
        draft.username.trim().replace(/\s+/g, "").replace(/^@/, "") ||
        "yogi",
      role: draft.role.trim() || "NEXUS User",
      bio: draft.bio.trim() || "Building, learning and exploring.",
      avatar: draft.avatar,
    };

    setProfile(cleanProfile);
    setDraft(cleanProfile);

    localStorage.setItem(PROFILE_KEY, JSON.stringify(cleanProfile));

    window.dispatchEvent(new Event("nexus-profile-change"));

    setEditing(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  function cancelEditing() {
    setDraft(profile);
    setEditing(false);
    setAvatarError("");
  }

  function copyUsername() {
    const username = `@${profile.username}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(username).catch(() => {});
    }

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  return (
    <section className="min-h-screen p-6 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-violet-300/60">
              <CircleUserRound size={14} />
              NEXUS Identity
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Profile
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Your personal identity, progress and activity inside NEXUS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  onClick={saveProfile}
                  className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-2.5 text-sm text-violet-200 transition hover:bg-violet-500/25"
                >
                  <Check size={16} />
                  Save Profile
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:border-violet-400/20 hover:bg-violet-500/10 hover:text-white"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* PROFILE HERO */}
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl md:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-500/[0.07] blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center">
              {/* AVATAR */}
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-full border border-violet-400/10 opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 shadow-2xl shadow-violet-950/20">
                  {editing ? (
                    draft.avatar ? (
                      <img
                        src={draft.avatar}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound
                        size={48}
                        className="text-white/30"
                      />
                    )
                  ) : profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-semibold text-white/80">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {editing && (
                  <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#15131f] text-white shadow-lg transition hover:bg-violet-500/20">
                    <Upload size={16} />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>

              {/* PROFILE INFO */}
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          name: event.target.value,
                        })
                      }
                      placeholder="Name"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-white/20 focus:border-violet-400/30"
                    />

                    <input
                      value={draft.username}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          username: event.target.value,
                        })
                      }
                      placeholder="Username"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/20 focus:border-violet-400/30"
                    />

                    <input
                      value={draft.role}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          role: event.target.value,
                        })
                      }
                      placeholder="Role"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/20 focus:border-violet-400/30"
                    />

                    <textarea
                      value={draft.bio}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          bio: event.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Short bio"
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/20 focus:border-violet-400/30"
                    />

                    {avatarError && (
                      <p className="text-xs text-red-300/80">
                        {avatarError}
                      </p>
                    )}

                    {draft.avatar && (
                      <button
                        onClick={() =>
                          setDraft({
                            ...draft,
                            avatar: "",
                          })
                        }
                        className="text-xs text-white/40 transition hover:text-red-300"
                      >
                        Remove avatar
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-semibold tracking-tight text-white">
                        {profile.name}
                      </h2>

                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300/80">
                        System Online
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={copyUsername}
                        className="flex items-center gap-2 text-sm text-violet-300/70 transition hover:text-violet-200"
                      >
                        @{profile.username}

                        {copied ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <span className="text-white/15">•</span>

                      <span className="text-sm text-white/35">
                        {profile.role}
                      </span>
                    </div>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
                      {profile.bio}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* LEVEL CARD */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                    NEXUS Progress
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Level {level}
                  </h3>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/10 bg-violet-500/10">
                  <Zap size={20} className="text-violet-300" />
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-end justify-between">
                  <span className="text-sm text-white/50">
                    {xp.toLocaleString()} XP
                  </span>

                  <span className="text-xs text-white/30">
                    {250 - currentLevelXP} XP to next level
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-700"
                    style={{
                      width: `${Math.max(xpProgress, 3)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-right text-[10px] text-white/25">
                  {xpProgress}% complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE STATS */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<CheckCircle2 size={17} />}
            label="Tasks"
            value={totalTasks.toString()}
            description={`${completedTasks} completed`}
          />

          <StatCard
            icon={<FileText size={17} />}
            label="Notes"
            value={totalNotes.toString()}
            description="Created in NEXUS"
          />

          <StatCard
            icon={<Flame size={17} />}
            label="Streak"
            value={streak.toString().padStart(2, "0")}
            description="Activity streak"
          />

          <StatCard
            icon={<Trophy size={17} />}
            label="Achievements"
            value={`${unlockedAchievements}/${achievements.length}`}
            description={`${achievementProgress}% unlocked`}
          />
        </div>

        {/* ACHIEVEMENTS */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
                <Award size={14} />
                Progress
              </div>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Achievements
              </h2>

              <p className="mt-1 text-sm text-white/35">
                Milestones unlocked through your NEXUS activity.
              </p>
            </div>

            <div className="text-sm text-white/40">
              <span className="text-white">{unlockedAchievements}</span>{" "}
              / {achievements.length} unlocked
            </div>
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-700"
              style={{
                width: `${achievementProgress}%`,
              }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const active = activeAchievement === achievement.id;

              return (
                <button
                  key={achievement.id}
                  onClick={() =>
                    setActiveAchievement(
                      active ? null : achievement.id,
                    )
                  }
                  className={`group relative rounded-2xl border p-4 text-left transition ${
                    achievement.unlocked
                      ? "border-violet-400/15 bg-violet-500/[0.06] hover:border-violet-400/30"
                      : "border-white/[0.06] bg-white/[0.015] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        achievement.unlocked
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-white/[0.04] text-white/25"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    {achievement.unlocked && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                        <Check size={13} />
                      </div>
                    )}
                  </div>

                  <h3 className="mt-4 text-sm font-medium text-white/80">
                    {achievement.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-white/30">
                    {achievement.description}
                  </p>

                  {active && (
                    <div className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-white/40">
                      {achievement.unlocked
                        ? "Achievement unlocked and recorded in your NEXUS profile."
                        : "Keep using NEXUS to unlock this achievement."}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVITY + STATUS */}
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {/* ACTIVITY */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
                  <Activity size={14} />
                  Timeline
                </div>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Recent Activity
                </h2>
              </div>

              <Link
                href="/analytics"
                className="flex items-center gap-1 text-xs text-white/30 transition hover:text-violet-300"
              >
                Analytics
                <ChevronRight size={13} />
              </Link>
            </div>

            {activity.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/[0.08] p-8 text-center">
                <Clipboard
                  size={24}
                  className="mx-auto text-white/20"
                />

                <p className="mt-3 text-sm text-white/40">
                  Your activity will appear here.
                </p>

                <p className="mt-1 text-xs text-white/20">
                  Complete a task or create a note to get started.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-1">
                {activity.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-violet-300/70">
                        <Icon size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white/65">
                          {item.title}
                        </p>

                        <p className="mt-1 text-[11px] text-white/25">
                          {formatDate(item.date)}
                        </p>
                      </div>

                      <span className="text-[10px] uppercase tracking-wider text-white/20">
                        {item.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SYSTEM STATUS */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
              <Settings size={14} />
              System
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              NEXUS Status
            </h2>

            <div className="mt-6 space-y-3">
              <StatusItem
                label="Profile Engine"
                value="ONLINE"
                online
              />

              <StatusItem
                label="Task Engine"
                value={totalTasks > 0 ? "READY" : "IDLE"}
                online={totalTasks > 0}
              />

              <StatusItem
                label="Notes Engine"
                value={totalNotes > 0 ? "READY" : "IDLE"}
                online={totalNotes > 0}
              />

              <StatusItem
                label="Local Storage"
                value="READY"
                online
              />

              <StatusItem
                label="AI Core"
                value="PENDING"
                online={false}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-violet-400/10 bg-violet-500/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                  <Sparkles
                    size={16}
                    className="text-violet-300"
                  />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    AI Core
                  </p>

                  <p className="mt-0.5 text-xs text-white/25">
                    Ollama + AI Router coming later
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEXUS ECOSYSTEM */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl md:p-7">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
              <LayoutDashboard size={14} />
              Ecosystem
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              NEXUS Modules
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Jump directly into the systems connected to your profile.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ModuleCard
              href="/tasks"
              icon={<Target size={18} />}
              title="Tasks"
              description={`${completedTasks} completed`}
            />

            <ModuleCard
              href="/notes"
              icon={<FileText size={18} />}
              title="Notes"
              description={`${totalNotes} created`}
            />

            <ModuleCard
              href="/achievements"
              icon={<Trophy size={18} />}
              title="Achievements"
              description={`${unlockedAchievements} unlocked`}
            />

            <ModuleCard
              href="/analytics"
              icon={<BarChart3 size={18} />}
              title="Analytics"
              description="View your data"
            />
          </div>
        </div>

        {/* SAVE MESSAGE */}
        {saved && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-[#11151a]/95 px-4 py-3 text-sm text-emerald-300 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 size={16} />
            Profile saved successfully
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-violet-400/15 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="text-violet-300/70">
          {icon}
        </div>

        <ChevronRight
          size={14}
          className="text-white/10 transition group-hover:translate-x-0.5 group-hover:text-white/30"
        />
      </div>

      <div className="mt-4">
        <p className="text-2xl font-semibold text-white">
          {value}
        </p>

        <p className="mt-1 text-xs font-medium text-white/50">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-white/20">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  online,
}: {
  label: string;
  value: string;
  online: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            online
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : "bg-white/20"
          }`}
        />

        <span className="text-sm text-white/45">
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-medium tracking-[0.15em] ${
          online
            ? "text-emerald-300/70"
            : "text-white/25"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/20 hover:bg-violet-500/[0.04]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-violet-300/70 transition group-hover:bg-violet-500/10 group-hover:text-violet-300">
          {icon}
        </div>

        <ChevronRight
          size={15}
          className="text-white/15 transition group-hover:translate-x-1 group-hover:text-white/40"
        />
      </div>

      <h3 className="mt-4 text-sm font-medium text-white/70">
        {title}
      </h3>

      <p className="mt-1 text-xs text-white/25">
        {description}
      </p>
    </Link>
  );
}
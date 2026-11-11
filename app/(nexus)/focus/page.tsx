"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  TimerReset,
} from "lucide-react";

const DEFAULT_MINUTES = 25;
const FOCUS_DATA_KEY = "nexus-focus-data";

type FocusData = {
  completedSessions: number;
  totalFocusSeconds: number;
};

export default function FocusPage() {
  const [durationMinutes, setDurationMinutes] =
    useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(
    DEFAULT_MINUTES * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [focusData, setFocusData] = useState<FocusData>({
    completedSessions: 0,
    totalFocusSeconds: 0,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOCUS_DATA_KEY);

      if (saved) {
        setFocusData(JSON.parse(saved));
      }
    } catch {
      // Ignore invalid localStorage data
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);

          setFocusData((previous) => {
            const updated = {
              completedSessions: previous.completedSessions + 1,
              totalFocusSeconds:
                previous.totalFocusSeconds + durationMinutes * 60,
            };

            localStorage.setItem(
              FOCUS_DATA_KEY,
              JSON.stringify(updated)
            );

            window.dispatchEvent(new Event("focus"));

            return updated;
          });

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, durationMinutes]);

  const totalSeconds = durationMinutes * 60;

  const progress = useMemo(() => {
    return ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  }, [secondsLeft, totalSeconds]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  const formatFocusTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const changeDuration = (minutes: number) => {
    if (isRunning) return;

    setDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const progressDash = 565;
  const dashOffset =
    progressDash - (progress / 100) * progressDash;

  return (
    <div className="min-h-screen bg-[#050509] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium tracking-[0.3em] text-violet-300/60">
            PRODUCTIVITY
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Focus
          </h1>

          <p className="mt-2 max-w-xl text-sm text-white/35">
            Enter deep focus mode and get one thing done at a time.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

          {/* Timer Card */}
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl md:p-8">

            {/* Glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex flex-col items-center">

              <div className="mb-5 flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-4 py-2">
                <Clock3
                  size={14}
                  className="text-violet-300/70"
                />

                <span className="text-[10px] font-medium tracking-[0.2em] text-white/40">
                  FOCUS SESSION
                </span>
              </div>

              {/* Timer */}
              <div className="relative flex h-[290px] w-[290px] items-center justify-center md:h-[340px] md:w-[340px]">

                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 200 200"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />

                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(167,139,250,0.85)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={progressDash}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-8 rounded-full border border-white/[0.04] bg-white/[0.015] shadow-[0_0_80px_rgba(139,92,246,0.08)]" />

                <div className="relative z-10 text-center">
                  <div className="font-mono text-6xl font-medium tracking-[-0.06em] text-white md:text-7xl">
                    {minutes}:{seconds}
                  </div>

                  <p className="mt-3 text-xs text-white/25">
                    {isRunning
                      ? "Focus session in progress"
                      : secondsLeft === 0
                        ? "Session complete"
                        : "Ready when you are"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-7 flex items-center gap-3">

                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  disabled={secondsLeft === 0}
                  className="flex h-12 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-5 text-sm font-medium text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRunning ? (
                    <>
                      <Pause size={16} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Start Focus
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/40 transition hover:bg-white/[0.07] hover:text-white/80"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={16} />
                </button>

              </div>
            </div>
          </section>

          {/* Right panel */}
          <div className="space-y-6">

            {/* Session Length */}
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                  <TimerReset
                    size={16}
                    className="text-violet-300/70"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-medium text-white">
                    Session Length
                  </h2>

                  <p className="text-[11px] text-white/25">
                    Choose your focus duration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 50].map((minutes) => {
                  const active =
                    durationMinutes === minutes;

                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() =>
                        changeDuration(minutes)
                      }
                      className={
                        active
                          ? "rounded-xl border border-violet-300/20 bg-violet-400/10 py-3 text-xs text-violet-200"
                          : "rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-xs text-white/35 transition hover:bg-white/[0.05] hover:text-white/70"
                      }
                    >
                      {minutes} min
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[90, 120].map((minutes) => {
                  const active =
                    durationMinutes === minutes;

                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() =>
                        changeDuration(minutes)
                      }
                      className={
                        active
                          ? "rounded-xl border border-violet-300/20 bg-violet-400/10 py-3 text-xs text-violet-200"
                          : "rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-xs text-white/35 transition hover:bg-white/[0.05] hover:text-white/70"
                      }
                    >
                      {minutes} min
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-4">

              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                  <CheckCircle2
                    size={16}
                    className="text-violet-300/70"
                  />
                </div>

                <p className="text-[10px] tracking-[0.2em] text-white/25">
                  SESSIONS
                </p>

                <p className="mt-2 text-2xl font-semibold text-white">
                  {focusData.completedSessions}
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                  <Clock3
                    size={16}
                    className="text-violet-300/70"
                  />
                </div>

                <p className="text-[10px] tracking-[0.2em] text-white/25">
                  FOCUS TIME
                </p>

                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatFocusTime(
                    focusData.totalFocusSeconds
                  )}
                </p>
              </div>

            </section>

            {/* Tip */}
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
              <p className="text-[10px] font-medium tracking-[0.25em] text-violet-300/60">
                NEXUS TIP
              </p>

              <p className="mt-3 text-sm leading-6 text-white/45">
                Put your phone away, close unnecessary tabs,
                and focus on one task until the timer ends.
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-white/[0.05] pt-5 text-[10px] tracking-[0.18em] text-white/20">
          NEXUS FOCUS SYSTEM
          <span className="float-right">
            SESSION DATA SAVED LOCALLY
          </span>
        </div>

      </div>
    </div>
  );
}
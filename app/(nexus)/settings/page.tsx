"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Database,
  Keyboard,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

type SettingsData = {
  accentGlow: boolean;
  animations: boolean;
  glassEffect: boolean;
  compactMode: boolean;
  showShortcuts: boolean;
  notifications: boolean;
  autoSave: boolean;
  confirmDelete: boolean;
};

const STORAGE_KEY = "nexus-settings";
const LOGO_KEY = "nexus-logo-hidden";

const defaultSettings: SettingsData = {
  accentGlow: true,
  animations: true,
  glassEffect: true,
  compactMode: false,
  showShortcuts: true,
  notifications: true,
  autoSave: true,
  confirmDelete: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [logoHidden, setLogoHidden] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      } catch {
        console.error("Failed to load NEXUS settings.");
      }
    }

    const savedLogoState = localStorage.getItem(LOGO_KEY);
    setLogoHidden(savedLogoState === "true");
  }, []);

  const updateSetting = (
    key: keyof SettingsData,
    value: boolean
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const toggleLogo = (hidden: boolean) => {
    setLogoHidden(hidden);

    localStorage.setItem(LOGO_KEY, String(hidden));

    // Instantly tell the sidebar about the change.
    window.dispatchEvent(new Event("nexus-logo-change"));

    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultSettings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const clearNexusData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all NEXUS data? This cannot be undone."
    );

    if (!confirmed) return;

    localStorage.removeItem("nexus-notes");
    localStorage.removeItem("nexus-tasks");
    localStorage.removeItem("nexus-notes-settings");
    localStorage.removeItem("nexus-settings");
    localStorage.removeItem(LOGO_KEY);

    setSettings(defaultSettings);
    setLogoHidden(false);

    window.dispatchEvent(new Event("nexus-logo-change"));

    alert("NEXUS data has been cleared.");
  };

  return (
    <section className="min-h-screen px-6 py-8 md:px-10 md:py-10">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Settings2
              size={17}
              className="text-violet-300"
            />

            <span className="text-[10px] font-medium tracking-[0.3em] text-violet-300/70">
              SYSTEM CONFIGURATION
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
            Configure your NEXUS experience, interface,
            preferences and local data.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSettings}
          className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white/80 md:flex"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Appearance */}
        <SettingsSection
          icon={<Palette size={16} />}
          title="Appearance"
          description="Control the visual atmosphere of NEXUS."
        >
          <SettingToggle
            icon={<Sparkles size={16} />}
            title="Accent Glow"
            description="Show subtle violet glow effects throughout the interface."
            enabled={settings.accentGlow}
            onChange={(value) =>
              updateSetting("accentGlow", value)
            }
          />

          <SettingToggle
            icon={<Zap size={16} />}
            title="Animations"
            description="Enable interface transitions and motion effects."
            enabled={settings.animations}
            onChange={(value) =>
              updateSetting("animations", value)
            }
          />

          <SettingToggle
            icon={<Moon size={16} />}
            title="Glass Effect"
            description="Use translucent glass-style panels and surfaces."
            enabled={settings.glassEffect}
            onChange={(value) =>
              updateSetting("glassEffect", value)
            }
          />
        </SettingsSection>

        {/* NEXUS Logo */}
        <SettingsSection
          icon={<Sparkles size={16} />}
          title="NEXUS Branding"
          description="Control the NEXUS branding shown in the sidebar."
        >
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-xs font-semibold text-white/70">
                N
              </div>

              <div>
                <p className="text-sm font-medium text-white/80">
                  NEXUS Logo
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Show or hide the NEXUS branding at the top of
                  the sidebar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleLogo(!logoHidden)}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-all ${
                !logoHidden
                  ? "border-violet-300/30 bg-violet-400/20"
                  : "border-white/10 bg-white/[0.06]"
              }`}
              aria-label={
                logoHidden
                  ? "Show NEXUS logo"
                  : "Hide NEXUS logo"
              }
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                  !logoHidden
                    ? "left-6 bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.7)]"
                    : "left-1 bg-white/30"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-xs text-white/40">
              Current status
            </span>

            <span
              className={`text-xs font-medium ${
                logoHidden
                  ? "text-white/35"
                  : "text-violet-300"
              }`}
            >
              {logoHidden ? "Logo hidden" : "Logo visible"}
            </span>
          </div>
        </SettingsSection>

        {/* Interface */}
        <SettingsSection
          icon={<Settings2 size={16} />}
          title="Interface"
          description="Adjust how information is presented."
        >
          <SettingToggle
            title="Compact Mode"
            description="Reduce spacing and make panels more compact."
            enabled={settings.compactMode}
            onChange={(value) =>
              updateSetting("compactMode", value)
            }
          />

          <SettingToggle
            icon={<Keyboard size={16} />}
            title="Show Keyboard Shortcuts"
            description="Display keyboard shortcut hints where available."
            enabled={settings.showShortcuts}
            onChange={(value) =>
              updateSetting("showShortcuts", value)
            }
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection
          icon={<Bell size={16} />}
          title="Preferences"
          description="Control automatic behaviors and notifications."
        >
          <SettingToggle
            icon={<Bell size={16} />}
            title="Notifications"
            description="Allow NEXUS to display notification messages."
            enabled={settings.notifications}
            onChange={(value) =>
              updateSetting("notifications", value)
            }
          />

          <SettingToggle
            title="Auto Save"
            description="Automatically save supported changes locally."
            enabled={settings.autoSave}
            onChange={(value) =>
              updateSetting("autoSave", value)
            }
          />

          <SettingToggle
            title="Confirm Before Delete"
            description="Ask for confirmation before deleting important data."
            enabled={settings.confirmDelete}
            onChange={(value) =>
              updateSetting("confirmDelete", value)
            }
          />
        </SettingsSection>

        {/* Keyboard shortcuts */}
        <SettingsSection
          icon={<Keyboard size={16} />}
          title="Keyboard Shortcuts"
          description="Quick controls available throughout NEXUS."
        >
          <ShortcutRow
            label="Command Center"
            shortcut="Ctrl + K"
          />

          <ShortcutRow
            label="New Note"
            shortcut="Ctrl + Shift + N"
          />

          <ShortcutRow
            label="Preferences"
            shortcut="Ctrl + Alt + P"
          />

          <ShortcutRow
            label="Close Overlay"
            shortcut="Esc"
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection
          icon={<Database size={16} />}
          title="Data & Storage"
          description="NEXUS currently stores application data locally in your browser."
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <Database
                size={17}
                className="mt-0.5 text-white/35"
              />

              <div>
                <p className="text-sm font-medium text-white/70">
                  Local Storage
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Notes, settings and other supported NEXUS
                  data are stored locally on this browser.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Reset */}
        <SettingsSection
          icon={<Trash2 size={16} />}
          title="Danger Zone"
          description="Actions that affect stored NEXUS data."
          danger
        >
          <div className="flex flex-col gap-4 rounded-xl border border-red-400/10 bg-red-400/[0.025] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-white/75">
                Clear NEXUS Data
              </p>

              <p className="mt-1 max-w-xl text-xs leading-5 text-white/35">
                Remove locally stored notes, tasks, settings
                and related NEXUS data from this browser.
              </p>
            </div>

            <button
              type="button"
              onClick={clearNexusData}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.04] px-4 py-2.5 text-xs text-red-300/70 transition hover:border-red-400/25 hover:bg-red-400/[0.08] hover:text-red-300"
            >
              <Trash2 size={14} />
              Clear Data
            </button>
          </div>
        </SettingsSection>

        {/* Save */}
        <div className="sticky bottom-5 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0b0b12]/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {saved ? (
              <>
                <Check
                  size={15}
                  className="text-emerald-300"
                />

                <span className="text-xs text-emerald-300/80">
                  Settings saved
                </span>
              </>
            ) : (
              <span className="text-xs text-white/30">
                Changes are not saved yet
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:bg-white/90"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   SETTINGS SECTION
------------------------------------------------------- */

function SettingsSection({
  icon,
  title,
  description,
  children,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white/[0.02] p-5 md:p-6 ${
        danger
          ? "border-red-400/[0.08]"
          : "border-white/[0.07]"
      }`}
    >
      <div className="mb-6 flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${
            danger
              ? "border-red-400/10 bg-red-400/[0.04] text-red-300/60"
              : "border-white/[0.07] bg-white/[0.03] text-violet-300/70"
          }`}
        >
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/85">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-white/35">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-1">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------
   TOGGLE
------------------------------------------------------- */

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl px-2 py-4 transition hover:bg-white/[0.02]">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-white/30">
            {icon}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-white/75">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/35">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-all ${
          enabled
            ? "border-violet-300/30 bg-violet-400/20"
            : "border-white/10 bg-white/[0.06]"
        }`}
        aria-label={`${title}: ${
          enabled ? "enabled" : "disabled"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
            enabled
              ? "left-6 bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.7)]"
              : "left-1 bg-white/30"
          }`}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   SHORTCUT
------------------------------------------------------- */

function ShortcutRow({
  label,
  shortcut,
}: {
  label: string;
  shortcut: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-3">
      <span className="text-sm text-white/55">
        {label}
      </span>

      <kbd className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-white/40">
        {shortcut}
      </kbd>
    </div>
  );
}
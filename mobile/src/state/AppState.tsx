// App-wide state shared by all screens. Owned by the coordinator.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getProfile, getSettings, saveProfile as dbSaveProfile, saveSettings as dbSaveSettings, useDb, type ProfileInput } from "../db";
import { calculateTargets, todayInIstanbul } from "../domain";
import type { Profile, Settings, Targets } from "../types";

export type AppState = {
  status: "loading" | "ready" | "error";
  error: Error | null;
  settings: Settings;
  profile: Profile | null;
  /** Daily targets, or null until the profile exists. */
  targets: Targets | null;
  /**
   * Increases after any write that other screens may display (diary, water, weight,
   * favorites, custom foods). Screens re-read their data when it changes.
   */
  dataVersion: number;
  notifyDataChanged: () => void;
  saveSettings: (settings: Settings) => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<void>;
  reload: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

const FALLBACK_SETTINGS: Settings = { language: null, waterGoalMl: 2000, reminders: [] };

export function AppStateProvider({ children }: { children: ReactNode }) {
  const db = useDb();
  const [status, setStatus] = useState<AppState["status"]>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<Settings>(FALLBACK_SETTINGS);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getSettings(db), getProfile(db)])
      .then(([s, p]) => {
        if (!active) return;
        setSettings(s);
        setProfile(p);
        setError(null);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [db, loadCount]);

  const notifyDataChanged = useCallback(() => setDataVersion((v) => v + 1), []);
  const reload = useCallback(() => {
    setStatus("loading");
    setLoadCount((c) => c + 1);
    setDataVersion((v) => v + 1);
  }, []);

  const saveSettings = useCallback(
    async (next: Settings) => {
      const saved = await dbSaveSettings(db, next);
      setSettings(saved);
    },
    [db],
  );

  const saveProfile = useCallback(
    async (input: ProfileInput) => {
      const saved = await dbSaveProfile(db, input);
      setProfile(saved);
    },
    [db],
  );

  const targets = useMemo(() => (profile ? calculateTargets(profile, todayInIstanbul()) : null), [profile]);

  const value = useMemo<AppState>(
    () => ({ status, error, settings, profile, targets, dataVersion, notifyDataChanged, saveSettings, saveProfile, reload }),
    [status, error, settings, profile, targets, dataVersion, notifyDataChanged, saveSettings, saveProfile, reload],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside <AppStateProvider>.");
  return value;
}

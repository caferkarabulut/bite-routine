import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { openDatabase } from "./open";
import type { Db } from "./types";

export type DatabaseState =
  | { status: "loading"; db: null; error: null; retry: () => void }
  | { status: "ready"; db: Db; error: null; retry: () => void }
  | { status: "error"; db: null; error: Error; retry: () => void };

const DatabaseContext = createContext<DatabaseState | null>(null);

export type DatabaseProviderProps = {
  children: ReactNode;
  /** Rendered while the database opens. */
  fallback?: ReactNode;
  /** Rendered when opening fails; receives the error and a retry function. */
  renderError?: (error: Error, retry: () => void) => ReactNode;
  /** Override for tests; defaults to the expo-sqlite based `openDatabase`. */
  open?: () => Promise<Db>;
};

type Result = { status: "loading" } | { status: "ready"; db: Db } | { status: "error"; error: Error };

export function DatabaseProvider({
  children,
  fallback = null,
  renderError,
  open = openDatabase,
}: DatabaseProviderProps) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ status: "loading" });

  const retry = useCallback(() => {
    setResult({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    open().then(
      (db) => {
        if (!cancelled) setResult({ status: "ready", db });
      },
      (e: unknown) => {
        if (!cancelled) setResult({ status: "error", error: e instanceof Error ? e : new Error(String(e)) });
      },
    );
    return () => {
      cancelled = true;
    };
    // `open` is intentionally not a dependency: the database is opened once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const value = useMemo<DatabaseState>(() => {
    if (result.status === "ready") return { status: "ready", db: result.db, error: null, retry };
    if (result.status === "error") return { status: "error", db: null, error: result.error, retry };
    return { status: "loading", db: null, error: null, retry };
  }, [result, retry]);

  let content: ReactNode;
  if (value.status === "ready") content = children;
  else if (value.status === "error") content = renderError ? renderError(value.error, retry) : null;
  else content = fallback;

  return <DatabaseContext.Provider value={value}>{content}</DatabaseContext.Provider>;
}

/** Full provider state (status, db, error, retry). Throws outside `DatabaseProvider`. */
export function useDatabaseState(): DatabaseState {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDb must be used inside <DatabaseProvider>.");
  return ctx;
}

/** The ready database. Throws outside the provider, or while it is not ready. */
export function useDb(): Db {
  const state = useDatabaseState();
  if (state.status !== "ready") {
    throw new Error("useDb called while the database is not ready; render it under <DatabaseProvider>.");
  }
  return state.db;
}

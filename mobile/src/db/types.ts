/**
 * The subset of expo-sqlite's async `SQLiteDatabase` used by the data layer.
 * Tests satisfy it with an adapter over Node's built-in `node:sqlite`.
 */
export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

export type RunResult = { lastInsertRowId: number; changes: number };

export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlParams): Promise<RunResult>;
  getAllAsync<T>(source: string, params: SqlParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlParams): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export type DbValidationCode =
  | "invalid_date"
  | "invalid_grams"
  | "invalid_kg"
  | "invalid_ml"
  | "invalid_meal_slot"
  | "invalid_value"
  | "invalid_backup"
  | "not_found";

/** Thrown at the repository boundary when input is out of range or malformed. */
export class DbValidationError extends Error {
  readonly code: DbValidationCode;

  constructor(code: DbValidationCode, message: string) {
    super(message);
    this.name = "DbValidationError";
    this.code = code;
    Object.setPrototypeOf(this, DbValidationError.prototype);
  }
}

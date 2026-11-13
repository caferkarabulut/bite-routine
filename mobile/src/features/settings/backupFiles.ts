// File side of backup/restore: write + share, pick + read + validate.
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { exportBackup, validateBackup, type Db } from "../../db";
import { todayInIstanbul } from "../../domain";
import type { BackupFile } from "../../types";

export function backupFileName(date = todayInIstanbul()): string {
  return `bite-routine-yedek-${date}.json`;
}

export class ShareUnavailableError extends Error {}

/** Writes the backup JSON to the cache directory and opens the share sheet. */
export async function createAndShareBackup(db: Db): Promise<void> {
  const backup = await exportBackup(db);
  const file = new File(Paths.cache, backupFileName());
  file.create({ overwrite: true });
  await file.write(JSON.stringify(backup, null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new ShareUnavailableError("sharing unavailable");
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json" });
}

export type PickedBackup =
  | { status: "canceled" }
  | { status: "invalid"; errors: string[] }
  | { status: "ok"; backup: BackupFile };

/** Lets the user pick a JSON file and validates it. Read errors throw. */
export async function pickBackup(): Promise<PickedBackup> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return { status: "canceled" };
  const text = await new File(result.assets[0].uri).text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "invalid", errors: ["not valid JSON"] };
  }
  const checked = validateBackup(parsed);
  return checked.ok ? { status: "ok", backup: checked.data } : { status: "invalid", errors: checked.errors };
}

export function backupCounts(backup: BackupFile): { entries: number; foods: number; days: number } {
  return {
    entries: backup.diaryEntries.length,
    foods: backup.customFoods.length,
    days: new Set(backup.diaryEntries.map((e) => e.date)).size,
  };
}

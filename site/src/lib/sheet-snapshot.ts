/**
 * Eén gedeelde Sheet-read: tabnamen + alle waarden in één batchGet,
 * daarna uit cache. Geen losse values.get per tab, geen retry-storm.
 */

import { tabNameFromRange } from "./sheet-rows.ts";

export const SHEET_CACHE_TTL_MS = 8 * 60_000;
export const SHEET_STALE_MAX_MS = 24 * 60 * 60_000;
export const SHEET_QUOTA_COOLDOWN_MS = 65_000;
export const SHEET_DAILY_QUOTA_COOLDOWN_MS = 30 * 60_000;
export const SHEET_ERROR_COOLDOWN_MS = 10_000;

export interface SheetTab {
  name: string;
  rows: string[][];
}

export interface SheetSnapshot {
  tabs: SheetTab[];
  fetchedAt: number;
}

export interface SheetBatchClient {
  listTabNames(): Promise<string[]>;
  batchGetValues(
    ranges: string[]
  ): Promise<{ range?: string | null; values?: string[][] | null }[]>;
}

export interface SheetReadContext {
  fresh: boolean;
}

const VALUE_RANGE = "A1:Z2000";

export function sheetTabRange(name: string): string {
  return `'${name.replace(/'/g, "''")}'!${VALUE_RANGE}`;
}

export function tabsFromValueRanges(
  names: string[],
  valueRanges: { range?: string | null; values?: string[][] | null }[]
): SheetTab[] {
  const byName = new Map<string, string[][]>();
  valueRanges.forEach((valueRange, index) => {
    const fromRange = valueRange.range ? tabNameFromRange(valueRange.range) : "";
    const name = fromRange || names[index] || "";
    if (!name) return;
    byName.set(name, valueRange.values ?? []);
  });

  return names.map((name, index) => ({
    name,
    rows: byName.get(name) ?? valueRanges[index]?.values ?? [],
  }));
}

/** Twee Sheets-reads totaal: metadata + één batchGet. Lege werkmap: alleen metadata. */
export async function fetchAllTabs(client: SheetBatchClient): Promise<SheetTab[]> {
  const names = await client.listTabNames();
  if (names.length === 0) return [];
  const valueRanges = await client.batchGetValues(names.map(sheetTabRange));
  return tabsFromValueRanges(names, valueRanges);
}

function sheetsErrorBits(err: unknown): { status: number; text: string } {
  if (!err || typeof err !== "object") return { status: 0, text: "" };
  const value = err as {
    message?: string;
    code?: number | string;
    status?: number | string;
    errors?: { reason?: string; message?: string }[];
    response?: { status?: number; data?: { error?: { message?: string; status?: string } } };
  };
  const status = Number(value.code ?? value.status ?? value.response?.status ?? 0);
  const text = [
    value.message,
    value.errors?.map((item) => `${item.reason ?? ""} ${item.message ?? ""}`).join(" "),
    value.response?.data?.error?.message,
    value.response?.data?.error?.status,
  ]
    .filter(Boolean)
    .join(" ");
  return { status, text };
}

export function isSheetsQuotaError(err: unknown): boolean {
  const { status, text } = sheetsErrorBits(err);
  if (status === 429) return true;
  return /quota exceeded|rateLimitExceeded|userRateLimitExceeded|dailyLimitExceeded/i.test(text);
}

export function isDailySheetsQuota(err: unknown): boolean {
  if (!isSheetsQuotaError(err)) return false;
  return /per day|dailyLimitExceeded/i.test(sheetsErrorBits(err).text);
}

export function createSheetSnapshotStore(options: {
  read: (ctx: SheetReadContext) => Promise<SheetSnapshot>;
  now?: () => number;
  cacheTtlMs?: number;
  staleMaxMs?: number;
  quotaCooldownMs?: number;
  dailyCooldownMs?: number;
  errorCooldownMs?: number;
}) {
  const now = options.now ?? (() => Date.now());
  const cacheTtlMs = options.cacheTtlMs ?? SHEET_CACHE_TTL_MS;
  const staleMaxMs = options.staleMaxMs ?? SHEET_STALE_MAX_MS;
  const quotaCooldownMs = options.quotaCooldownMs ?? SHEET_QUOTA_COOLDOWN_MS;
  const dailyCooldownMs = options.dailyCooldownMs ?? SHEET_DAILY_QUOTA_COOLDOWN_MS;
  const errorCooldownMs = options.errorCooldownMs ?? SHEET_ERROR_COOLDOWN_MS;

  let snapshot: SheetSnapshot | null = null;
  let inflight: Promise<SheetSnapshot> | null = null;
  let blockedUntil = 0;
  let blockIsDaily = false;
  let bypassCache = false;

  function rememberFailure(err: unknown) {
    blockIsDaily = isDailySheetsQuota(err);
    const wait = isSheetsQuotaError(err)
      ? blockIsDaily
        ? dailyCooldownMs
        : quotaCooldownMs
      : errorCooldownMs;
    blockedUntil = now() + wait;
  }

  function blockedError(): Error {
    const message = blockIsDaily
      ? "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per day'"
      : "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user'";
    const err = new Error(message) as Error & { code?: number };
    err.code = 429;
    return err;
  }

  async function load(fresh: boolean): Promise<SheetSnapshot> {
    try {
      const next = await options.read({ fresh });
      snapshot = next;
      bypassCache = false;
      blockedUntil = 0;
      return next;
    } catch (err) {
      rememberFailure(err);
      if (snapshot && now() - snapshot.fetchedAt < staleMaxMs) {
        const message = err instanceof Error ? err.message : "Sheet read failed";
        console.error("[Sheet] read failed, serving cache:", message);
        return snapshot;
      }
      throw err;
    }
  }

  return {
    async get(opts?: { fresh?: boolean }): Promise<SheetSnapshot> {
      const fresh = Boolean(opts?.fresh) || bypassCache;
      const t = now();
      if (!fresh && snapshot && t - snapshot.fetchedAt < cacheTtlMs) {
        return snapshot;
      }
      if (t < blockedUntil) {
        if (snapshot && t - snapshot.fetchedAt < staleMaxMs) return snapshot;
        throw blockedError();
      }
      if (inflight) return inflight;
      const pending = load(fresh).finally(() => {
        inflight = null;
      });
      inflight = pending;
      return pending;
    },
    invalidate() {
      bypassCache = true;
    },
    patchTab(name: string, rows: string[][]) {
      if (!snapshot) return;
      snapshot = {
        fetchedAt: snapshot.fetchedAt,
        tabs: snapshot.tabs.map((tab) => (tab.name === name ? { name, rows } : tab)),
      };
    },
    current(): SheetSnapshot | null {
      return snapshot;
    },
  };
}

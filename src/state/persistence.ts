import { initialState, type WorkspaceState } from './workspace';
import type { Alias } from '../core/types';

export const STORAGE_KEY = 'gitaliases-studio:v1';

type Stored = Partial<WorkspaceState> & { version?: number };

/** v1 stored a bare LogRecipe on aliases; v2 tags every recipe with its kind. */
function migrateAlias(a: Alias): Alias {
  const recipe = a.recipe as unknown;
  if (recipe && typeof recipe === 'object' && !('kind' in recipe)) {
    return { ...a, recipe: { kind: 'log', log: recipe as never } };
  }
  return a;
}

/** Returns a v2 state from stored data, or null when the data can't be used. */
export function migrate(data: unknown, platform?: string): WorkspaceState | null {
  const d = data as Stored | null;
  if (!d || typeof d !== 'object' || !Array.isArray(d.aliases) || !Array.isArray(d.baseline) || !d.draft) return null;
  const fresh = initialState(platform);
  if (d.version === 2) return { ...fresh, ...d } as WorkspaceState;
  if (d.version === 1) {
    return {
      ...fresh,
      ...d,
      version: 2,
      aliases: d.aliases.map(migrateAlias),
      baseline: d.baseline.map(migrateAlias),
    } as WorkspaceState;
  }
  return null;
}

/** Never throws: missing, blocked, corrupt or unknown data all start a fresh workspace. */
export function loadWorkspace(storage: Pick<Storage, 'getItem'> | null, platform?: string): WorkspaceState {
  const fresh = initialState(platform);
  if (!storage) return fresh;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    return migrate(JSON.parse(raw), platform) ?? fresh;
  } catch {
    return fresh;
  }
}

export function saveWorkspace(storage: Pick<Storage, 'setItem'> | null, s: WorkspaceState): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked: the app keeps working for this visit.
  }
}

export function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

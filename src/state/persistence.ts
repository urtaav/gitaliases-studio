import { initialState, type WorkspaceState } from './workspace';

export const STORAGE_KEY = 'gitaliases-studio:v1';

/** Never throws: missing, blocked, corrupt or old data all start a fresh workspace. */
export function loadWorkspace(
  storage: Pick<Storage, 'getItem'> | null,
  platform?: string,
): WorkspaceState {
  const fresh = initialState(platform);
  if (!storage) return fresh;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw) as Partial<WorkspaceState>;
    if (data?.version !== 1 || !Array.isArray(data.aliases) || !Array.isArray(data.baseline) || !data.draft) {
      return fresh;
    }
    return { ...fresh, ...data } as WorkspaceState;
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

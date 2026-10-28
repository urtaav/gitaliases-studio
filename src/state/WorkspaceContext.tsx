import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { diffAliases, reducer, type Action, type WorkspaceState } from './workspace';
import { loadWorkspace, safeLocalStorage, saveWorkspace } from './persistence';
import type { Change } from '../core/types';

interface WorkspaceValue {
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
  changes: Change[];
}

const WorkspaceCtx = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadWorkspace(safeLocalStorage(), navigator.platform),
  );

  useEffect(() => {
    const id = setTimeout(() => saveWorkspace(safeLocalStorage(), state), 300);
    return () => clearTimeout(id);
  }, [state]);

  const changes = useMemo(() => diffAliases(state.baseline, state.aliases), [state.baseline, state.aliases]);
  const value = useMemo(() => ({ state, dispatch, changes }), [state, changes]);

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}

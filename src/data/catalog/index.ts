import { buildRecipeValue } from '../../core/recipe';
import { copy } from '../../i18n';
import { DEFAULT_BRANCH_RECIPE } from '../../core/branchFormat';
import { CHART_PRESETS } from '../../core/chartFormat';
import { DEFAULT_RECIPE, type LogRecipe } from '../../core/logFormat';
import { undoSituation } from '../../core/undo';
import type { Recipe, Risk } from '../../core/types';

export type DesignerKind = 'log' | 'branches' | 'chart' | 'undo';

export interface CatalogEntry {
  name: string;
  value: string;
  description: string;
  example: string;
  risk?: Risk;
  designer?: DesignerKind;
  preset?: string;
  recipe?: Recipe;
}

export interface CatalogGroup {
  id: string;
  order: number;
  title: string;
  entries: CatalogEntry[];
}

const LOG_PRESETS: Record<string, LogRecipe> = {
  hist: {
    ...DEFAULT_RECIPE,
    fields: [
      { uid: 'h-hash', placeholder: '%h', color: 'auto', attrs: [], width: 0, align: 'left', trunc: 'none' },
      { uid: 'h-date', placeholder: '%ad', color: 'cyan', attrs: [], width: 0, align: 'left', trunc: 'none' },
      { uid: 'h-author', placeholder: '%an', color: 'yellow', attrs: [], width: 0, align: 'left', trunc: 'none' },
      { uid: 'h-subject', placeholder: '%s', color: '', attrs: [], width: 0, align: 'left', trunc: 'none' },
      { uid: 'h-refs', placeholder: '%d', color: 'auto', attrs: [], width: 0, align: 'left', trunc: 'none' },
    ],
    separator: '',
    separatorColor: '',
    dateFormat: 'format:%Y-%m-%d %H:%M',
    highlight: { ...DEFAULT_RECIPE.highlight, enabled: false },
  },
};

/** The recipe a catalog entry is built from, so "Customize" opens it prefilled. */
export function presetRecipe(designer: DesignerKind, preset: string): Recipe | null {
  switch (designer) {
    case 'log':
      return LOG_PRESETS[preset] ? { kind: 'log', log: LOG_PRESETS[preset] } : null;
    case 'branches':
      return preset === 'recent' ? { kind: 'branches', branches: DEFAULT_BRANCH_RECIPE } : null;
    case 'chart': {
      const c = CHART_PRESETS[preset as keyof typeof CHART_PRESETS];
      return c ? { kind: 'chart', chart: c } : null;
    }
    case 'undo': {
      const s = undoSituation(preset);
      // Asking before running is on by default for destructive undo aliases.
      return s ? { kind: 'undo', undo: { situationId: s.id, confirm: s.risk === 'destructive' } } : null;
    }
  }
}

type RawEntry = Omit<CatalogEntry, 'value' | 'recipe'> & { value?: string };
type RawGroup = Omit<CatalogGroup, 'entries'> & { entries: RawEntry[] };

/**
 * Entries with a designer get their value from it, so the two never drift apart.
 * Texts come from the active language when it has a translation.
 */
function resolve(e: RawEntry): CatalogEntry {
  const description = copy.catalogText[e.name] ?? e.description;
  if (!e.designer || !e.preset) return { ...e, description, value: e.value ?? '' };
  const recipe = presetRecipe(e.designer, e.preset);
  if (!recipe) return { ...e, description, value: e.value ?? '' };
  return { ...e, description, value: buildRecipeValue(recipe), recipe };
}

const files = import.meta.glob<RawGroup>('./*.json', { eager: true, import: 'default' });
const RAW = Object.values(files).sort((a, b) => a.order - b.order);

/** The catalog in the active language. Cheap enough to build on every render. */
export function getCatalog(): CatalogGroup[] {
  return RAW.map((g) => ({ ...g, title: copy.catalogGroups[g.id] ?? g.title, entries: g.entries.map(resolve) }));
}

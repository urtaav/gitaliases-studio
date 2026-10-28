import { buildBranchAliasValue, type BranchRecipe } from './branchFormat';
import { buildChartAliasValue, type ChartRecipe } from './chartFormat';
import { buildLogAliasValue, type LogRecipe } from './logFormat';
import { buildUndoAliasValue, type UndoRecipe } from './undo';

/** How a designer-built alias was made, so it can be reopened in its designer. */
export type Recipe =
  | { kind: 'log'; log: LogRecipe }
  | { kind: 'branches'; branches: BranchRecipe }
  | { kind: 'chart'; chart: ChartRecipe }
  | { kind: 'undo'; undo: UndoRecipe };

export function buildRecipeValue(r: Recipe): string {
  switch (r.kind) {
    case 'log': return buildLogAliasValue(r.log);
    case 'branches': return buildBranchAliasValue(r.branches);
    case 'chart': return buildChartAliasValue(r.chart);
    case 'undo': return buildUndoAliasValue(r.undo);
  }
}

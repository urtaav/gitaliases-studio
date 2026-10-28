import type { ChartMetric } from '../core/chartFormat';

export interface ChartRow {
  label: string;
  count: number;
}

// Fictional data shaped like each metric's real output.
export const SAMPLE_CHART: Record<ChartMetric, readonly ChartRow[]> = {
  day: [
    { label: '2026-10-19', count: 2 },
    { label: '2026-10-20', count: 6 },
    { label: '2026-10-21', count: 4 },
    { label: '2026-10-22', count: 9 },
    { label: '2026-10-23', count: 3 },
    { label: '2026-10-26', count: 1 },
    { label: '2026-10-27', count: 7 },
  ],
  week: [
    { label: '2026-W39', count: 14 },
    { label: '2026-W40', count: 22 },
    { label: '2026-W41', count: 9 },
    { label: '2026-W42', count: 31 },
    { label: '2026-W43', count: 18 },
  ],
  author: [
    { label: 'Ana Lucía Hernández', count: 124 },
    { label: 'you', count: 87 },
    { label: 'Kenji Watanabe', count: 52 },
    { label: 'dependabot[bot]', count: 19 },
    { label: 'Marta Ruiz', count: 4 },
  ],
  file: [
    { label: 'src/app/search.ts', count: 41 },
    { label: 'src/export/csv.ts', count: 33 },
    { label: 'README.md', count: 21 },
    { label: 'src/app/filters.ts', count: 17 },
    { label: 'package.json', count: 12 },
    { label: 'src/styles.css', count: 6 },
  ],
};

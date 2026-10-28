import { describe, expect, test } from 'vitest';
import { buildChartAliasValue, CHART_PRESETS, explainChart, renderChartPreview } from '../../src/core/chartFormat';
import { SAMPLE_CHART } from '../../src/data/sampleChart';

describe('presets', () => {
  test('activity', () => {
    const v = buildChartAliasValue(CHART_PRESETS.activity);
    expect(v.startsWith('!git log --since=60.days.ago --date=short --format=%ad | sort | uniq -c | awk ')).toBe(true);
  });
  test('authors', () => {
    const v = buildChartAliasValue(CHART_PRESETS.authors);
    expect(v).toContain('git log --no-merges --format=%an | sort | uniq -c | sort -rn | head -n 15 | awk');
  });
  test('churn', () => {
    const v = buildChartAliasValue(CHART_PRESETS.churn);
    expect(v).toContain("--name-only --format= | grep -v '^$' | sort | uniq -c | sort -rn | head -n 20");
  });
  test('weekly buckets use ISO weeks', () => {
    expect(buildChartAliasValue({ ...CHART_PRESETS.activity, metric: 'week' })).toContain('--date=format:%G-W%V');
  });
});

test('awk stays portable and handles empty periods', () => {
  const v = buildChartAliasValue(CHART_PRESETS.activity);
  expect(v).not.toContain('\\x1b');
  expect(v).toContain(String.raw`\033[`);
  expect(v).toContain('No commits in this period.');
  expect(v).toContain('*40/m');
  // Without a color there are no escape codes at all.
  expect(buildChartAliasValue({ ...CHART_PRESETS.activity, color: '' })).not.toContain('\\033');
});

test('options appear in the command and the explanation', () => {
  const r = { ...CHART_PRESETS.activity, allBranches: true, merges: false, periodDays: 7 as const };
  expect(buildChartAliasValue(r)).toContain('git log --all --no-merges --since=7.days.ago');
  expect(explainChart(r).map((p) => p.source)).toEqual(['command', 'allBranches', 'merges', 'period', 'metric', 'metric', 'bar']);
});

describe('preview scaling', () => {
  test.each(['day', 'week', 'author', 'file'] as const)('%s bars fit maxWidth', (metric) => {
    const r = { ...CHART_PRESETS.activity, metric, maxWidth: 20, top: 3 };
    for (const line of renderChartPreview(r, SAMPLE_CHART[metric])) {
      const bar = line.at(-1)!.text;
      expect(bar.length).toBeGreaterThanOrEqual(1);
      expect(bar.length).toBeLessThanOrEqual(20);
    }
  });
  test('ranked metrics keep the top N, biggest first', () => {
    const lines = renderChartPreview({ ...CHART_PRESETS.authors, top: 2 }, SAMPLE_CHART.author);
    expect(lines.map((l) => l[0]!.text.trim())).toEqual(['Ana Lucía Hernández', 'you']);
  });
  test('no rows', () => expect(renderChartPreview(CHART_PRESETS.activity, [])[0]![0]!.text).toBe('No commits in this period.'));
});

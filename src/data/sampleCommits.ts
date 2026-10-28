export interface SampleCommit {
  hash: string;
  fullHash: string;
  tree: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  /** ISO date without zone; rendered as -0600. */
  date: string;
  subject: string;
  body: string;
  refs: string[];
  isMe: boolean;
}

/** "Now" for relative dates, so the preview never changes between visits. */
export const PREVIEW_NOW = '2026-10-28T10:00:00';

const h = (short: string) => short + 'e4b1f0c29a7d3385b6c0e12f9d4a7b6c81';

const c = (
  hash: string,
  parents: string[],
  authorName: string,
  authorEmail: string,
  date: string,
  subject: string,
  refs: string[] = [],
  body = '',
): SampleCommit => ({
  hash,
  fullHash: h(hash),
  tree: h(hash.split('').reverse().join('')),
  parents,
  authorName,
  authorEmail,
  date,
  subject,
  body,
  refs,
  isMe: authorEmail === 'you@example.com',
});

// Fictional people and project.
export const SAMPLE_COMMITS: readonly SampleCommit[] = [
  c('d3a3ac7', ['30bf098'], 'you', 'you@example.com', '2026-10-15T16:54:00', 'fix: keep page size when filters change', ['HEAD -> main', 'origin/main']),
  c('30bf098', ['caef1dc'], 'Ana Lucía Hernández', 'ana@example.com', '2026-10-15T16:18:00', 'feat: filter records by period', [], 'Adds start and end date pickers.'),
  c('caef1dc', ['a9be6d5', '71c4d0e'], 'you', 'you@example.com', '2026-10-15T12:18:00', "Merge branch 'feature/search' into main", ['origin/feature/search']),
  c('a9be6d5', ['3bc5574'], 'Kenji Watanabe', 'kenji@example.com', '2026-10-09T10:02:00', 'docs: explain the export options'),
  c('3bc5574', ['f4be8cc'], 'Ana Lucía Hernández', 'ana@example.com', '2026-10-02T18:40:00', 'refactor: split count and page queries', ['tag: v1.2.0']),
  c('f4be8cc', ['9e01b2a'], 'you', 'you@example.com', '2026-09-24T09:15:00', 'chore: upgrade the build tools'),
  c('9e01b2a', ['71c4d0e'], 'dependabot[bot]', 'bot@example.com', '2026-09-20T03:11:00', 'build(deps): bump parser from 2.17.1 to 2.17.2'),
  c('71c4d0e', ['5d2e8a1'], 'Kenji Watanabe', 'kenji@example.com', '2026-09-18T13:27:00', 'test: cover CSV export with nested tables'),
];

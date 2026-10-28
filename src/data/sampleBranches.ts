export interface SampleBranch {
  name: string;
  /** ISO date of the last commit, without zone. */
  date: string;
  author: string;
  subject: string;
  hash: string;
  upstream: string;
  ahead: number;
  behind: number;
  current: boolean;
  remote: boolean;
}

// Fictional branches for the preview.
export const SAMPLE_BRANCHES: readonly SampleBranch[] = [
  { name: 'feature/search', date: '2026-10-27T18:02:00', author: 'Ana Lucía Hernández', subject: 'feat: search by title', hash: '9c41e2a', upstream: 'origin/feature/search', ahead: 2, behind: 0, current: true, remote: false },
  { name: 'main', date: '2026-10-26T11:40:00', author: 'you', subject: 'fix: keep page size when filters change', hash: 'd3a3ac7', upstream: 'origin/main', ahead: 0, behind: 3, current: false, remote: false },
  { name: 'fix/export-csv', date: '2026-10-21T09:15:00', author: 'Kenji Watanabe', subject: 'fix: escape commas in CSV export', hash: '4be8cc1', upstream: 'origin/fix/export-csv', ahead: 0, behind: 0, current: false, remote: false },
  { name: 'docs/readme', date: '2026-10-14T16:30:00', author: 'you', subject: 'docs: add setup steps', hash: '71c4d0e', upstream: '', ahead: 0, behind: 0, current: false, remote: false },
  { name: 'spike/charts', date: '2026-09-30T13:05:00', author: 'Kenji Watanabe', subject: 'wip: try bar charts', hash: 'a9be6d5', upstream: '', ahead: 0, behind: 0, current: false, remote: false },
  { name: 'release/1.2', date: '2026-09-12T10:00:00', author: 'Ana Lucía Hernández', subject: 'chore: release 1.2.0', hash: '3bc5574', upstream: 'origin/release/1.2', ahead: 1, behind: 2, current: false, remote: false },
  { name: 'origin/main', date: '2026-10-28T08:20:00', author: 'Ana Lucía Hernández', subject: 'feat: filter records by period', hash: '30bf098', upstream: '', ahead: 0, behind: 0, current: false, remote: true },
  { name: 'origin/feature/login', date: '2026-10-19T15:45:00', author: 'Kenji Watanabe', subject: 'feat: login with SSO', hash: 'caef1dc', upstream: '', ahead: 0, behind: 0, current: false, remote: true },
];

export type FieldGroup = 'Hash' | 'Author' | 'Committer' | 'Message' | 'Refs' | 'Other';
export type FieldRole = 'hash' | 'date' | 'author' | 'subject' | 'refs' | 'other';

export interface FieldDef {
  placeholder: string;
  label: string;
  group: FieldGroup;
  role: FieldRole;
  multiline?: boolean;
}

export const FIELD_DEFS: readonly FieldDef[] = [
  { placeholder: '%h', label: 'Commit hash (short)', group: 'Hash', role: 'hash' },
  { placeholder: '%H', label: 'Commit hash (full)', group: 'Hash', role: 'hash' },
  { placeholder: '%p', label: 'Parent hashes (short)', group: 'Hash', role: 'hash' },
  { placeholder: '%P', label: 'Parent hashes (full)', group: 'Hash', role: 'hash' },
  { placeholder: '%t', label: 'Tree hash (short)', group: 'Hash', role: 'hash' },
  { placeholder: '%T', label: 'Tree hash (full)', group: 'Hash', role: 'hash' },

  { placeholder: '%an', label: 'Author name', group: 'Author', role: 'author' },
  { placeholder: '%ae', label: 'Author email', group: 'Author', role: 'author' },
  { placeholder: '%al', label: 'Author email user', group: 'Author', role: 'author' },
  { placeholder: '%ad', label: 'Author date', group: 'Author', role: 'date' },
  { placeholder: '%ar', label: 'Author date, relative', group: 'Author', role: 'date' },
  { placeholder: '%as', label: 'Author date, short', group: 'Author', role: 'date' },

  { placeholder: '%cn', label: 'Committer name', group: 'Committer', role: 'author' },
  { placeholder: '%ce', label: 'Committer email', group: 'Committer', role: 'author' },
  { placeholder: '%cl', label: 'Committer email user', group: 'Committer', role: 'author' },
  { placeholder: '%cd', label: 'Commit date', group: 'Committer', role: 'date' },
  { placeholder: '%cr', label: 'Commit date, relative', group: 'Committer', role: 'date' },
  { placeholder: '%cs', label: 'Commit date, short', group: 'Committer', role: 'date' },

  { placeholder: '%s', label: 'Subject', group: 'Message', role: 'subject' },
  { placeholder: '%f', label: 'Subject as file name', group: 'Message', role: 'subject' },
  { placeholder: '%b', label: 'Body', group: 'Message', role: 'subject', multiline: true },
  { placeholder: '%B', label: 'Full message', group: 'Message', role: 'subject', multiline: true },

  { placeholder: '%d', label: 'Branches and tags', group: 'Refs', role: 'refs' },
  { placeholder: '%D', label: 'Branches and tags, no parentheses', group: 'Refs', role: 'refs' },

  { placeholder: '%G?', label: 'Signature status', group: 'Other', role: 'other' },
  { placeholder: '%n', label: 'New line', group: 'Other', role: 'other' },
];

export const fieldDef = (placeholder: string): FieldDef | undefined =>
  FIELD_DEFS.find((f) => f.placeholder === placeholder);

import { copy } from '../i18n';

export type FieldGroup = 'Hash' | 'Author' | 'Committer' | 'Message' | 'Refs' | 'Other';
export type FieldRole = 'hash' | 'date' | 'author' | 'subject' | 'refs' | 'other';

export interface FieldDef {
  placeholder: string;
  group: FieldGroup;
  role: FieldRole;
  multiline?: boolean;
}

export const FIELD_DEFS: readonly FieldDef[] = [
  { placeholder: '%h', group: 'Hash', role: 'hash' },
  { placeholder: '%H', group: 'Hash', role: 'hash' },
  { placeholder: '%p', group: 'Hash', role: 'hash' },
  { placeholder: '%P', group: 'Hash', role: 'hash' },
  { placeholder: '%t', group: 'Hash', role: 'hash' },
  { placeholder: '%T', group: 'Hash', role: 'hash' },

  { placeholder: '%an', group: 'Author', role: 'author' },
  { placeholder: '%ae', group: 'Author', role: 'author' },
  { placeholder: '%al', group: 'Author', role: 'author' },
  { placeholder: '%ad', group: 'Author', role: 'date' },
  { placeholder: '%ar', group: 'Author', role: 'date' },
  { placeholder: '%as', group: 'Author', role: 'date' },

  { placeholder: '%cn', group: 'Committer', role: 'author' },
  { placeholder: '%ce', group: 'Committer', role: 'author' },
  { placeholder: '%cl', group: 'Committer', role: 'author' },
  { placeholder: '%cd', group: 'Committer', role: 'date' },
  { placeholder: '%cr', group: 'Committer', role: 'date' },
  { placeholder: '%cs', group: 'Committer', role: 'date' },

  { placeholder: '%s', group: 'Message', role: 'subject' },
  { placeholder: '%f', group: 'Message', role: 'subject' },
  { placeholder: '%b', group: 'Message', role: 'subject', multiline: true },
  { placeholder: '%B', group: 'Message', role: 'subject', multiline: true },

  { placeholder: '%d', group: 'Refs', role: 'refs' },
  { placeholder: '%D', group: 'Refs', role: 'refs' },

  { placeholder: '%G?', group: 'Other', role: 'other' },
  { placeholder: '%n', group: 'Other', role: 'other' },
];

export const fieldDef = (placeholder: string): FieldDef | undefined =>
  FIELD_DEFS.find((f) => f.placeholder === placeholder);

/** Plain-language name of a placeholder in the active language. */
export const fieldLabel = (placeholder: string): string => copy.core.fields[placeholder] ?? placeholder;

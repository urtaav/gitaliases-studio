export interface CatalogEntry {
  name: string;
  value: string;
  description: string;
  example: string;
  warning?: string;
}

export interface CatalogGroup {
  id: string;
  order: number;
  title: string;
  entries: CatalogEntry[];
}

const files = import.meta.glob<CatalogGroup>('./*.json', { eager: true, import: 'default' });

export const CATALOG: readonly CatalogGroup[] = Object.values(files).sort((a, b) => a.order - b.order);

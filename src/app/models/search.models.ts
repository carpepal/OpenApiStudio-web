export type SearchResultType = 'schema' | 'path' | 'server' | 'tag' | 'security';

export interface SearchResultViewModel {
  id: string;
  type: SearchResultType;
  label: string;
  subtitle: string;
  route: string;
  fragment: string;
}

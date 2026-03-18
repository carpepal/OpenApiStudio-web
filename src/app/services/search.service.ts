import { Injectable } from '@angular/core';
import { SearchResultViewModel, SearchResultType } from '../models/search.models';
import { OpenApiFormsService } from './open-api-forms.service';

const PREFIX_MAP: Record<string, SearchResultType> = {
  'schema:': 'schema',
  'path:': 'path',
  'server:': 'server',
  'tag:': 'tag',
  'security:': 'security',
};

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private forms: OpenApiFormsService) {}

  search(rawQuery: string): SearchResultViewModel[] {
    const trimmed = rawQuery.trim().toLowerCase();
    if (!trimmed) return [];

    const { activeType, term } = this.parseQuery(trimmed);
    const searchers = this.buildSearchers(activeType);

    return searchers.flatMap(searcher => searcher(term));
  }

  private parseQuery(query: string): { activeType: SearchResultType | null; term: string } {
    for (const [prefix, type] of Object.entries(PREFIX_MAP)) {
      if (query.startsWith(prefix)) {
        return { activeType: type, term: query.slice(prefix.length) };
      }
    }
    return { activeType: null, term: query };
  }

  private buildSearchers(
    activeType: SearchResultType | null
  ): Array<(term: string) => SearchResultViewModel[]> {
    const all: Array<[SearchResultType, (term: string) => SearchResultViewModel[]]> = [
      ['schema', (term) => this.searchSchemas(term)],
      ['path', (term) => this.searchPaths(term)],
      ['server', (term) => this.searchServers(term)],
      ['tag', (term) => this.searchTags(term)],
      ['security', (term) => this.searchSecurity(term)],
    ];

    return activeType
      ? all.filter(([type]) => type === activeType).map(([, fn]) => fn)
      : all.map(([, fn]) => fn);
  }

  private searchSchemas(term: string): SearchResultViewModel[] {
    return this.forms.schemaGroups
      .map((group, index) => ({ name: (group.get('name')?.value ?? '') as string, index }))
      .filter(({ name }) => name.toLowerCase().includes(term))
      .map(({ name, index }) => ({
        id: `schema-${index}`,
        type: 'schema' as SearchResultType,
        label: name || '(sin nombre)',
        subtitle: 'Schema',
        route: '/schemas',
        fragment: `item-schema-${index}`,
      }));
  }

  private searchPaths(term: string): SearchResultViewModel[] {
    return this.forms.pathGroups
      .map((group, index) => ({
        path: (group.get('path')?.value ?? '') as string,
        method: (group.get('method')?.value ?? '') as string,
        operationId: (group.get('operationId')?.value ?? '') as string,
        index,
      }))
      .filter(({ path, method, operationId }) =>
        path.toLowerCase().includes(term) ||
        method.toLowerCase().includes(term) ||
        operationId.toLowerCase().includes(term)
      )
      .map(({ path, method, operationId, index }) => ({
        id: `path-${index}`,
        type: 'path' as SearchResultType,
        label: path ? `${method.toUpperCase()} ${path}` : operationId || '(sin nombre)',
        subtitle: `Path · ${method.toUpperCase()}`,
        route: '/paths',
        fragment: `item-path-${index}`,
      }));
  }

  private searchServers(term: string): SearchResultViewModel[] {
    return this.forms.serverGroups
      .map((group, index) => ({
        url: (group.get('url')?.value ?? '') as string,
        entorno: (group.get('entorno')?.value ?? '') as string,
        index,
      }))
      .filter(({ url, entorno }) =>
        url.toLowerCase().includes(term) || entorno.toLowerCase().includes(term)
      )
      .map(({ url, entorno, index }) => ({
        id: `server-${index}`,
        type: 'server' as SearchResultType,
        label: url || entorno || '(sin nombre)',
        subtitle: entorno ? `Server · ${entorno}` : 'Server',
        route: '/server',
        fragment: `item-server-${index}`,
      }));
  }

  private searchTags(term: string): SearchResultViewModel[] {
    return this.forms.tagGroups
      .map((group, index) => ({ name: (group.get('name')?.value ?? '') as string, index }))
      .filter(({ name }) => name.toLowerCase().includes(term))
      .map(({ name, index }) => ({
        id: `tag-${index}`,
        type: 'tag' as SearchResultType,
        label: name || '(sin nombre)',
        subtitle: 'Tag',
        route: '/tags',
        fragment: `item-tag-${index}`,
      }));
  }

  private searchSecurity(term: string): SearchResultViewModel[] {
    return this.forms.schemeGroups
      .map((group, index) => ({
        schemeName: (group.get('schemeName')?.value ?? '') as string,
        type: (group.get('type')?.value ?? '') as string,
        index,
      }))
      .filter(({ schemeName, type }) =>
        schemeName.toLowerCase().includes(term) || type.toLowerCase().includes(term)
      )
      .map(({ schemeName, type, index }) => ({
        id: `security-${index}`,
        type: 'security' as SearchResultType,
        label: schemeName || '(sin nombre)',
        subtitle: `Security · ${type}`,
        route: '/security',
        fragment: `item-security-${index}`,
      }));
  }
}

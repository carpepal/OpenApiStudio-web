import { Component, Input, signal, Provider } from '@angular/core';
import { LucideAngularModule, Lock, ChevronUp, ChevronDown, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  OpenApiPathItem,
  OpenApiOperation,
  OpenApiResponse,
  OpenApiSchemaObject,
} from '../../../models/open-api.models';
import { generateExample } from './schema-example-generator';

interface OperationEntry {
  path: string;
  method: string;
  operation: OpenApiOperation;
}

@Component({
  selector: 'app-paths-section',
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Lock, ChevronUp, ChevronDown }) } as Provider,
  ],
  template: `
    <div class="flex flex-col gap-2">
      @for (entry of flatOperations(); track entry.path + entry.method) {
        @let opKey = entry.path + ':' + entry.method;
        @let open = isOpen(opKey);

        <div class="rounded-md overflow-hidden border border-border-light">

          <!-- Card header -->
          <button
            class="w-full flex items-center gap-2 px-3.5 py-2.5 bg-card text-left hover:brightness-95 transition-all"
            (click)="toggleOp(opKey)">

            <!-- Method badge -->
            <span class="shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-[3px] leading-none"
              [style]="methodStyle(entry.method)">{{ entry.method }}</span>

            <!-- Path -->
            <span class="font-mono text-xs font-medium text-text-primary truncate">{{ entry.path }}</span>

            <!-- Summary -->
            @if (entry.operation.summary) {
              <span class="text-xs text-text-secondary font-normal truncate hidden sm:block">{{ entry.operation.summary }}</span>
            }

            <div class="flex-1"></div>

            <!-- Lock icon when security present -->
            @if (entry.operation.security && entry.operation.security.length > 0) {
              <lucide-icon name="lock" [size]="12" class="text-text-tertiary shrink-0" />
            }

            <!-- Chevron -->
            <lucide-icon [name]="open ? 'chevron-up' : 'chevron-down'" [size]="14" class="text-text-tertiary shrink-0" />
          </button>

          <!-- Card body -->
          @if (open) {
            <div class="bg-inset px-3.5 py-3.5 flex flex-col gap-3 border-t border-border-light">

              @let reqBody = entry.operation.requestBody;
              @let primaryResp = primaryResponse(entry.operation);
              @let otherResps = otherResponses(entry.operation);

              <!-- No request body -->
              @if (!reqBody) {
                <p class="text-[9px] italic text-text-tertiary">No request body</p>
              }

              <!-- Request section -->
              @if (reqBody) {
                @let firstMime = firstMimeEntry(reqBody.content);
                <div class="flex flex-col gap-2">
                  <!-- Header row -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-text-primary">Request</span>
                    @if (reqBody.required) {
                      <span class="text-[9px] text-red-400">required</span>
                    }
                    <div class="flex-1"></div>
                    @if (firstMime) {
                      <span class="px-2 py-0.5 font-mono text-[9px] text-text-tertiary border border-border-light rounded bg-surface-muted">{{ firstMime.key }}</span>
                    }
                  </div>
                  <!-- Code block -->
                  @if (firstMime) {
                    <pre class="bg-surface rounded-md p-3 font-mono text-[10px] text-text-secondary leading-[1.5] overflow-x-auto whitespace-pre">{{ exampleJson(firstMime.schema) }}</pre>
                  }
                </div>

                <!-- Divider -->
                <div class="h-px bg-border-light w-full"></div>
              }

              <!-- Primary response -->
              @if (primaryResp) {
                @let firstRespMime = firstMimeEntry(primaryResp.response.content ?? {});
                <div class="flex flex-col gap-2">
                  <!-- Header row -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-text-primary">Response</span>
                    <span class="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] leading-none"
                      [style]="statusStyle(primaryResp.code)">{{ primaryResp.code }}</span>
                    @if (primaryResp.response.description) {
                      <span class="text-[10px] text-text-secondary truncate">{{ primaryResp.response.description }}</span>
                    }
                    <div class="flex-1"></div>
                    @if (firstRespMime) {
                      <span class="px-2 py-0.5 font-mono text-[9px] text-text-tertiary border border-border-light rounded bg-surface-muted">{{ firstRespMime.key }}</span>
                    }
                  </div>
                  <!-- Code block -->
                  @if (firstRespMime) {
                    <pre class="bg-surface rounded-md p-3 font-mono text-[10px] text-text-secondary leading-[1.5] overflow-x-auto whitespace-pre">{{ exampleJson(firstRespMime.schema) }}</pre>
                  } @else {
                    <p class="text-[9px] italic text-text-tertiary">No response body</p>
                  }
                </div>
              }

              <!-- Other responses -->
              @if (otherResps.length > 0) {
                <div class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Other Responses</span>
                  @for (resp of otherResps; track resp.code) {
                    <div class="flex items-center gap-2 bg-surface rounded px-2.5 py-1.5">
                      <span class="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] leading-none"
                        [style]="statusStyle(resp.code)">{{ resp.code }}</span>
                      <span class="text-[10px] text-text-secondary truncate">{{ resp.response.description }}</span>
                      <div class="flex-1"></div>
                    </div>
                  }
                </div>
              }

            </div>
          }

        </div>
      }
    </div>
  `,
})
export class PathsSectionComponent {
  @Input({ required: true }) set paths(value: Record<string, OpenApiPathItem>) {
    this._paths = value;
    this._openOps.set({});
  }
  get paths(): Record<string, OpenApiPathItem> { return this._paths; }

  @Input() schemas: Record<string, OpenApiSchemaObject> = {};

  private _paths: Record<string, OpenApiPathItem> = {};
  private _openOps = signal<Record<string, boolean>>({});

  private readonly HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

  private readonly METHOD_STYLES: Record<string, string> = {
    get:     'background:#166534; color:#4ADE80;',
    post:    'background:#7C2D12; color:#FB923C;',
    put:     'background:#92400E; color:#FBBF24;',
    patch:   'background:#581C87; color:#C084FC;',
    delete:  'background:#991B1B; color:#FCA5A5;',
    head:    'background:#1E3A5F; color:#93C5FD;',
    options: 'background:#1E3A5F; color:#93C5FD;',
  };

  flatOperations(): OperationEntry[] {
    const result: OperationEntry[] = [];
    for (const [path, pathItem] of Object.entries(this._paths)) {
      for (const method of this.HTTP_METHODS) {
        if (pathItem[method]) {
          result.push({ path, method, operation: pathItem[method] as OpenApiOperation });
        }
      }
    }
    return result;
  }

  isOpen(key: string): boolean {
    return this._openOps()[key] ?? false;
  }

  toggleOp(key: string): void {
    const cur = this._openOps();
    this._openOps.set({ ...cur, [key]: !cur[key] });
  }

  methodStyle(method: string): string {
    return this.METHOD_STYLES[method] ?? 'background:#334155; color:#CBD5E1;';
  }

  statusStyle(code: string): string {
    const prefix = code[0];
    switch (prefix) {
      case '2': return 'background:#166534; color:#4ADE80;';
      case '3': return 'background:#1E3A5F; color:#93C5FD;';
      case '4': return 'background:#92400E; color:#FBBF24;';
      case '5': return 'background:#991B1B; color:#FCA5A5;';
      default:  return 'background:#334155; color:#CBD5E1;';
    }
  }

  primaryResponse(op: OpenApiOperation): { code: string; response: OpenApiResponse } | null {
    if (!op.responses) return null;
    const entry = Object.entries(op.responses).find(([code]) => code.startsWith('2'));
    return entry ? { code: entry[0], response: entry[1] } : null;
  }

  otherResponses(op: OpenApiOperation): { code: string; response: OpenApiResponse }[] {
    if (!op.responses) return [];
    return Object.entries(op.responses)
      .filter(([code]) => !code.startsWith('2'))
      .map(([code, response]) => ({ code, response }));
  }

  firstMimeEntry(content: Record<string, { schema: OpenApiSchemaObject }>): { key: string; schema: OpenApiSchemaObject } | null {
    const entries = Object.entries(content);
    if (entries.length === 0) return null;
    return { key: entries[0][0], schema: entries[0][1].schema };
  }

  exampleJson(schema: OpenApiSchemaObject): string {
    try {
      return JSON.stringify(generateExample(schema, this.schemas), null, 2);
    } catch {
      return '{}';
    }
  }
}

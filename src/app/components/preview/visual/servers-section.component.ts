import { Component, Input, signal } from '@angular/core';
import { OpenApiServer } from '../../../models/open-api.models';

@Component({
  selector: 'app-servers-section',
  template: `
    <div class="flex flex-col gap-2">
      <select
        class="text-xs bg-surface border border-border-light rounded px-2 py-1.5 text-text-primary"
        (change)="onSelect($event)">
        @for (server of servers; track $index) {
          <option [value]="$index">{{ server.url }}</option>
        }
      </select>
      @if (selectedServer()) {
        <code class="block text-xs font-mono bg-surface-muted text-code px-3 py-2 rounded break-all">{{ selectedServer()!.url }}</code>
        @if (selectedServer()!.description) {
          <p class="text-xs text-text-secondary">{{ selectedServer()!.description }}</p>
        }
      }
    </div>
  `,
})
export class ServersSectionComponent {
  @Input({ required: true }) set servers(value: OpenApiServer[]) {
    this._servers = value;
    this.selectedIndex.set(0);
  }
  get servers(): OpenApiServer[] { return this._servers; }

  private _servers: OpenApiServer[] = [];
  readonly selectedIndex = signal(0);

  selectedServer() {
    return this._servers[this.selectedIndex()] ?? null;
  }

  onSelect(event: Event): void {
    const idx = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedIndex.set(idx);
  }
}

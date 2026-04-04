import { Injectable, signal, inject } from '@angular/core';
import { dump } from 'js-yaml';
import { StorageService, StoredSpecEntry } from './storage.service';
import { VscodeMessageBridgeService } from '../vscode-message-bridge.service';
import { OpenApiSpec } from '../../models/open-api.models';

@Injectable()
export class VscodeStorageService extends StorageService {
  private readonly bridge = inject(VscodeMessageBridgeService);

  readonly currentSpec = signal<StoredSpecEntry | null>(null);
  readonly isLoading = signal(false);

  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  async saveSpec(entry: StoredSpecEntry): Promise<void> {
    this.bridge.postMessage('saveSpec', { entry });
    this.currentSpec.set(entry);
    this.scheduleSyncFile(entry.spec);
  }

  async deleteSpec(_id: string): Promise<void> {
    this.bridge.postMessage('clearSpec', {});
    this.currentSpec.set(null);
  }

  loadSpec(entry: StoredSpecEntry): void {
    this.currentSpec.set(entry);
  }

  /** Debounce file writes — waits 1 s after the last change before writing. */
  private scheduleSyncFile(spec: OpenApiSpec): void {
    const fileName = this.bridge.currentFileName;
    if (!fileName) return; // opened without a file (e.g. "API Studio: Open") — nothing to sync

    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      const lower = fileName.toLowerCase();
      const content = lower.endsWith('.json')
        ? JSON.stringify(spec, null, 2)
        : dump(spec, { lineWidth: -1, noRefs: true });
      this.bridge.postMessage('syncFile', { content });
    }, 1000);
  }
}

import { Injectable, inject } from '@angular/core';
import { OpenApiImportService } from './open-api-import.service';

type MessageHandler = (payload: unknown) => void;

@Injectable()
export class VscodeMessageBridgeService {
  private readonly importService = inject(OpenApiImportService);

  private readonly vscodeApi = (window as any).vscodeApi as {
    postMessage(msg: unknown): void;
  };

  private readonly handlers = new Map<string, MessageHandler>();

  private pendingFileRequest: ((result: { content: string; fileName: string } | null) => void) | null = null;

  /** Name of the file currently loaded (e.g. "petstore.yaml"). Used to pick YAML vs JSON serialisation. */
  currentFileName: string | null = null;

  constructor() {
    window.addEventListener('message', (event: MessageEvent) => {
      // Accept messages only from the VS Code extension host (origin is 'null' or vscode-webview://)
      // or from the same origin when running in browser dev mode.
      const isVsCodeHost = event.origin === 'null' || event.origin.startsWith('vscode-webview://');
      const isSameOrigin = event.origin === window.location.origin;
      if (!isVsCodeHost && !isSameOrigin) {
        console.warn('[VscodeMessageBridge] Rejected message from untrusted origin:', event.origin);
        return;
      }
      this.handleMessage(event.data);
    });

    this.postMessage('ready', {});
  }

  postMessage(type: string, payload: unknown = {}): void {
    this.vscodeApi.postMessage({ type, payload });
  }

  onMessage(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  requestFile(): Promise<{ content: string; fileName: string } | null> {
    return new Promise(resolve => {
      this.pendingFileRequest = resolve;
      this.postMessage('openFile', {});
    });
  }

  private handleMessage(data: { type: string; payload: unknown }): void {
    if (!data?.type) return;

    switch (data.type) {
      case 'loadSpec': {
        const { content, fileName } = data.payload as { content: string; fileName: string };
        this.currentFileName = fileName;
        try {
          this.importService.importFromString(content, fileName);
        } catch (err) {
          console.error('[VscodeMessageBridge] Error loading spec:', err);
        }
        break;
      }

      case 'fileContent': {
        const payload = data.payload as { content: string; fileName: string } | null;
        if (this.pendingFileRequest) {
          this.pendingFileRequest(payload ?? null);
          this.pendingFileRequest = null;
        }
        break;
      }

      case 'restoreSpec': {
        const entry = data.payload as { spec: unknown; name: string };
        try {
          this.importService.importFromString(
            JSON.stringify(entry.spec),
            (entry.name ?? 'spec') + '.json',
          );
        } catch (err) {
          console.error('[VscodeMessageBridge] Error restoring spec:', err);
        }
        break;
      }

      default: {
        const handler = this.handlers.get(data.type);
        handler?.(data.payload);
      }
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { ClipboardService } from './clipboard.service';
import { VscodeMessageBridgeService } from '../vscode-message-bridge.service';

@Injectable()
export class VscodeClipboardService extends ClipboardService {
  private readonly bridge = inject(VscodeMessageBridgeService);

  async writeText(text: string): Promise<void> {
    this.bridge.postMessage('clipboard', { text });
  }
}

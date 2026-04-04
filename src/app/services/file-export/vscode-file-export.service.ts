import { Injectable, inject } from '@angular/core';
import { FileExportService } from './file-export.service';
import { VscodeMessageBridgeService } from '../vscode-message-bridge.service';

@Injectable()
export class VscodeFileExportService extends FileExportService {
  private readonly bridge = inject(VscodeMessageBridgeService);

  download(content: string, fileName: string, mimeType: string): void {
    this.bridge.postMessage('saveFile', { content, fileName, mimeType });
  }
}

import { Injectable, inject } from '@angular/core';
import { FileImportService } from './file-import.service';
import { VscodeMessageBridgeService } from '../vscode-message-bridge.service';

@Injectable()
export class VscodeFileImportService extends FileImportService {
  private readonly bridge = inject(VscodeMessageBridgeService);

  pickAndReadFile(): Promise<{ content: string; fileName: string } | null> {
    return this.bridge.requestFile();
  }
}

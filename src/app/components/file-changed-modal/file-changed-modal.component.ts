import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { OpenApiImportService } from '../../services/open-api-import.service';
import { VscodeMessageBridgeService } from '../../services/vscode-message-bridge.service';

@Component({
  selector: 'app-file-changed-modal',
  standalone: true,
  templateUrl: './file-changed-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileChangedModalComponent {
  private readonly importService = inject(OpenApiImportService);
  private readonly bridge = inject(VscodeMessageBridgeService, { optional: true });

  readonly isOpen = signal(false);
  readonly fileName = signal('');
  private pendingContent = '';
  private pendingFileName = '';

  constructor() {
    this.bridge?.onMessage('fileChanged', (payload) => {
      const { content, fileName } = payload as { content: string; fileName: string };
      this.open(content, fileName);
    });
  }

  open(content: string, fileName: string): void {
    this.pendingContent = content;
    this.pendingFileName = fileName;
    this.fileName.set(fileName);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  confirm(): void {
    try {
      this.importService.importFromString(this.pendingContent, this.pendingFileName);
    } catch (err) {
      console.error('[FileChangedModal] Error al cargar los cambios:', err);
    }
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }
}

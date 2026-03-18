import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { OpenApiImportService } from '../../services/open-api-import.service';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './import-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportModalComponent {
  private readonly importService = inject(OpenApiImportService);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly isOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly isSuccess = signal(false);

  open(): void {
    this.isOpen.set(true);
    this.error.set(null);
    this.fileName.set(null);
    this.isSuccess.set(false);
  }

  close(): void {
    this.isOpen.set(false);
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    this.error.set(null);
    this.fileName.set(file.name);
    this.isSuccess.set(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.importService.importFromString(content, file.name);
        this.isSuccess.set(true);
        setTimeout(() => this.close(), 800);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido al procesar el fichero.';
        this.error.set(message);
        this.isSuccess.set(false);
      }
    };
    reader.onerror = () => {
      this.error.set('No se pudo leer el fichero.');
    };
    reader.readAsText(file);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }
}

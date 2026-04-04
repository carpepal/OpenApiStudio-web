import { Component, Input, inject, signal } from '@angular/core';
import { OpenApiBuilderService } from '../../services/open-api-builder.service';
import { ClipboardService } from '../../services/clipboard/clipboard.service';
import { FileExportService } from '../../services/file-export/file-export.service';
import { LucideAngularModule, Copy, Download, Check, Eye, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { VisualPreviewComponent } from './visual/visual-preview.component';

type PreviewTab = 'json' | 'yaml' | 'visual';

@Component({
  selector: 'app-preview',
  imports: [LucideAngularModule, VisualPreviewComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Copy, Download, Check, Eye }) }],
  templateUrl: 'preview.component.html',
})
export class PreviewComponent {
  @Input() active: boolean = false;

  readonly activeTab = signal<PreviewTab>('json');
  readonly copied = signal(false);

  private readonly clipboard = inject(ClipboardService);
  private readonly fileExport = inject(FileExportService);

  constructor(readonly builder: OpenApiBuilderService) {}

  get content(): string {
    return this.activeTab() === 'json'
      ? this.builder.specAsJson()
      : this.builder.specAsYaml();
  }

  get lineNumbers(): number[] {
    const lines = this.content.split('\n').length;
    return Array.from({ length: lines }, (_, index) => index + 1);
  }

  setTab(tab: PreviewTab): void {
    this.activeTab.set(tab);
  }

  isCodeTab(): boolean {
    return this.activeTab() === 'json' || this.activeTab() === 'yaml';
  }

  async copy(): Promise<void> {
    try {
      await this.clipboard.writeText(this.content);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
    }
  }

  download(): void {
    const extension = this.activeTab() === 'json' ? 'json' : 'yaml';
    const mimeType = this.activeTab() === 'json' ? 'application/json' : 'text/yaml';
    this.fileExport.download(this.content, `openapi-spec.${extension}`, mimeType);
  }
}

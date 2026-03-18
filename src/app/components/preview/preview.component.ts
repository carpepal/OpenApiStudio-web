import { Component, Input, signal } from '@angular/core';
import { OpenApiBuilderService } from '../../services/open-api-builder.service';
import { LucideAngularModule, Copy, Download, Check, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

type PreviewTab = 'json' | 'yaml';

@Component({
  selector: 'app-preview',
  imports: [LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Copy, Download, Check }) }],
  templateUrl: 'preview.component.html',
})
export class PreviewComponent {
  @Input() active: boolean = false;

  readonly activeTab = signal<PreviewTab>('json');
  readonly copied = signal(false);

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

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.content);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
    }
  }

  download(): void {
    const extension = this.activeTab() === 'json' ? 'json' : 'yaml';
    const mimeType = this.activeTab() === 'json' ? 'application/json' : 'text/yaml';
    const blob = new Blob([this.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `openapi-spec.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

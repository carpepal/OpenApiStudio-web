import { Component, Input } from '@angular/core';
import { OpenApiBuilderService } from '../../services/open-api-builder.service';

type PreviewTab = 'json' | 'yaml';

@Component({
  selector: 'app-preview',
  imports: [],
  templateUrl: 'preview.component.html',
})
export class PreviewComponent {
  @Input() active: boolean = false;

  activeTab: PreviewTab = 'json';

  constructor(readonly builder: OpenApiBuilderService) {}

  get content(): string {
    return this.activeTab === 'json'
      ? this.builder.specAsJson()
      : this.builder.specAsYaml();
  }

  setTab(tab: PreviewTab): void {
    this.activeTab = tab;
  }

  copy(): void {
    navigator.clipboard.writeText(this.content);
  }
}

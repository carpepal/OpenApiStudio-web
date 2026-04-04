import { Component, Input } from '@angular/core';
import { OpenApiInfo } from '../../../models/open-api.models';

@Component({
  selector: 'app-info-section',
  template: `
    <div class="flex items-center gap-2 flex-wrap py-2">
      <span class="text-[15px] font-semibold text-text-primary leading-none">{{ info.title }}</span>
      <span class="px-1.5 py-0.5 text-[9px] font-mono rounded leading-none"
        style="background: rgba(34,211,238,0.12); color: #22D3EE;">v{{ info.version }}</span>
      <div class="flex-1"></div>
      <span class="px-1.5 py-0.5 text-[9px] font-mono rounded leading-none"
        style="background: rgba(34,197,94,0.12); color: #22C55E;">OAS {{ oasLabel }}</span>
    </div>
  `,
})
export class InfoSectionComponent {
  @Input({ required: true }) info!: OpenApiInfo;
  @Input() openapi: string = '3.0';

  get oasLabel(): string {
    return this.openapi.startsWith('3.1') ? '3.1' : '3.0';
  }
}

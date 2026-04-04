import { Component, Input } from '@angular/core';
import { OpenApiSpec } from '../../../models/open-api.models';
import { InfoSectionComponent } from './info-section.component';
import { ServersSectionComponent } from './servers-section.component';
import { PathsSectionComponent } from './paths-section.component';
import { SecuritySectionComponent } from './security-section.component';
import { SchemasSectionComponent } from './schemas-section.component';

@Component({
  selector: 'app-visual-preview',
  imports: [
    InfoSectionComponent,
    ServersSectionComponent,
    PathsSectionComponent,
    SecuritySectionComponent,
    SchemasSectionComponent,
  ],
  template: `
    <div class="overflow-y-auto px-4 pb-4 flex flex-col h-full">

      <!-- Info bar -->
      <app-info-section [info]="spec.info" [openapi]="spec.openapi" />

      <!-- Thin divider -->
      <div class="h-px bg-border-light mb-4"></div>

      <!-- Servers -->
      @if (spec.servers && spec.servers.length > 0) {
        <div class="mb-4">
          <app-servers-section [servers]="spec.servers" />
        </div>
      }

      <!-- Paths (flat operation cards) -->
      @if (spec.paths && pathCount() > 0) {
        <app-paths-section
          [paths]="spec.paths!"
          [schemas]="spec.components?.schemas ?? {}" />
      }

      <!-- Divider before lower sections -->
      @if (securityCount() > 0 || schemaCount() > 0) {
        <div class="h-px bg-border-light my-4"></div>
      }

      <!-- Security Schemes -->
      @if (spec.components?.securitySchemes && securityCount() > 0) {
        <div class="mb-4">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-2">Security Schemes</span>
          <app-security-section [securitySchemes]="spec.components!.securitySchemes!" />
        </div>
      }

      <!-- Schemas -->
      @if (spec.components?.schemas && schemaCount() > 0) {
        <div class="mb-4">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-2">Schemas</span>
          <app-schemas-section [schemas]="spec.components!.schemas!" />
        </div>
      }

    </div>
  `,
})
export class VisualPreviewComponent {
  @Input({ required: true }) spec!: OpenApiSpec;

  pathCount(): number {
    return this.spec.paths ? Object.keys(this.spec.paths).length : 0;
  }

  securityCount(): number {
    return this.spec.components?.securitySchemes ? Object.keys(this.spec.components.securitySchemes).length : 0;
  }

  schemaCount(): number {
    return this.spec.components?.schemas ? Object.keys(this.spec.components.schemas).length : 0;
  }
}

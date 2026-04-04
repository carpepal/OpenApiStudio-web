import { Component, Input } from '@angular/core';
import {
  OpenApiSecurityScheme,
  OpenApiApiKeyScheme,
  OpenApiHttpScheme,
  OpenApiOAuth2Scheme,
  OpenApiOpenIdConnectScheme,
} from '../../../models/open-api.models';

@Component({
  selector: 'app-security-section',
  template: `
    <div class="flex flex-col gap-2">
      @for (entry of schemeEntries(); track entry.name) {
        <div class="border border-border-light rounded-md px-3 py-2 flex flex-col gap-2 bg-surface">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold font-mono text-text-primary">{{ entry.name }}</span>
            <span class="px-2 py-0.5 text-xs rounded {{ typeClass(entry.scheme.type) }}">{{ entry.scheme.type }}</span>
          </div>

          @if (entry.scheme.description) {
            <p class="text-xs text-text-secondary">{{ entry.scheme.description }}</p>
          }

          @if (isApiKey(entry.scheme)) {
            <div class="flex flex-col gap-0.5 text-xs text-text-secondary">
              <span><span class="font-medium">name:</span> <span class="font-mono">{{ asApiKey(entry.scheme).name }}</span></span>
              <span><span class="font-medium">in:</span> <span class="font-mono">{{ asApiKey(entry.scheme).in }}</span></span>
            </div>
          }

          @if (isHttp(entry.scheme)) {
            <div class="flex flex-col gap-0.5 text-xs text-text-secondary">
              <span><span class="font-medium">scheme:</span> <span class="font-mono">{{ asHttp(entry.scheme).scheme }}</span></span>
              @if (asHttp(entry.scheme).bearerFormat) {
                <span><span class="font-medium">bearerFormat:</span> <span class="font-mono">{{ asHttp(entry.scheme).bearerFormat }}</span></span>
              }
            </div>
          }

          @if (isOAuth2(entry.scheme)) {
            @let flows = asOAuth2(entry.scheme).flows;
            <div class="flex flex-col gap-1.5">
              @if (flows.implicit) {
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-medium text-text-muted">implicit</span>
                  <span class="text-xs text-text-secondary font-mono break-all">{{ flows.implicit.authorizationUrl }}</span>
                  <div class="flex flex-wrap gap-1">
                    @for (scope of scopeEntries(flows.implicit.scopes); track scope.name) {
                      <span class="px-1.5 py-0.5 text-xs rounded bg-surface-muted text-text-secondary font-mono" [title]="scope.desc">{{ scope.name }}</span>
                    }
                  </div>
                </div>
              }
              @if (flows.clientCredentials) {
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-medium text-text-muted">clientCredentials</span>
                  <span class="text-xs text-text-secondary font-mono break-all">{{ flows.clientCredentials.tokenUrl }}</span>
                  <div class="flex flex-wrap gap-1">
                    @for (scope of scopeEntries(flows.clientCredentials.scopes); track scope.name) {
                      <span class="px-1.5 py-0.5 text-xs rounded bg-surface-muted text-text-secondary font-mono" [title]="scope.desc">{{ scope.name }}</span>
                    }
                  </div>
                </div>
              }
              @if (flows.authorizationCode) {
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-medium text-text-muted">authorizationCode</span>
                  <span class="text-xs text-text-secondary font-mono break-all">{{ flows.authorizationCode.authorizationUrl }}</span>
                  <div class="flex flex-wrap gap-1">
                    @for (scope of scopeEntries(flows.authorizationCode.scopes); track scope.name) {
                      <span class="px-1.5 py-0.5 text-xs rounded bg-surface-muted text-text-secondary font-mono" [title]="scope.desc">{{ scope.name }}</span>
                    }
                  </div>
                </div>
              }
              @if (flows.password) {
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-medium text-text-muted">password</span>
                  <span class="text-xs text-text-secondary font-mono break-all">{{ flows.password.tokenUrl }}</span>
                </div>
              }
            </div>
          }

          @if (isOpenId(entry.scheme)) {
            <span class="text-xs font-mono text-accent break-all">{{ asOpenId(entry.scheme).openIdConnectUrl }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class SecuritySectionComponent {
  @Input({ required: true }) securitySchemes!: Record<string, OpenApiSecurityScheme>;

  schemeEntries(): { name: string; scheme: OpenApiSecurityScheme }[] {
    return Object.entries(this.securitySchemes).map(([name, scheme]) => ({ name, scheme }));
  }

  scopeEntries(scopes: Record<string, string>): { name: string; desc: string }[] {
    return Object.entries(scopes).map(([name, desc]) => ({ name, desc }));
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      apiKey: 'bg-badge-amber-bg text-badge-amber-text',
      http: 'bg-badge-blue-bg text-badge-blue-text',
      oauth2: 'bg-badge-green-bg text-badge-green-text',
      openIdConnect: 'bg-badge-purple-bg text-badge-purple-text',
    };
    return map[type] ?? 'bg-badge-slate-bg text-badge-slate-text';
  }

  isApiKey(s: OpenApiSecurityScheme): boolean { return s.type === 'apiKey'; }
  isHttp(s: OpenApiSecurityScheme): boolean { return s.type === 'http'; }
  isOAuth2(s: OpenApiSecurityScheme): boolean { return s.type === 'oauth2'; }
  isOpenId(s: OpenApiSecurityScheme): boolean { return s.type === 'openIdConnect'; }

  asApiKey(s: OpenApiSecurityScheme): OpenApiApiKeyScheme { return s as OpenApiApiKeyScheme; }
  asHttp(s: OpenApiSecurityScheme): OpenApiHttpScheme { return s as OpenApiHttpScheme; }
  asOAuth2(s: OpenApiSecurityScheme): OpenApiOAuth2Scheme { return s as OpenApiOAuth2Scheme; }
  asOpenId(s: OpenApiSecurityScheme): OpenApiOpenIdConnectScheme { return s as OpenApiOpenIdConnectScheme; }
}

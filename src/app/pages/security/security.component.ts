import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { LucideAngularModule, Trash2, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-security',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Trash2 }) }],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
})
export class SecurityComponent {
  readonly securityTypes = ['apiKey', 'http', 'oauth2', 'openIdConnect'];
  readonly apiKeyLocations = ['header', 'query', 'cookie'];
  readonly httpSchemes = ['bearer', 'basic', 'digest'];
  readonly oauthFlows = ['implicit', 'password', 'clientCredentials', 'authorizationCode'];

  constructor(public forms: OpenApiFormsService) {}

  getType(index: number): string {
    return this.forms.schemesForm.at(index).get('type')?.value ?? 'apiKey';
  }

  getOAuthFlow(index: number): string {
    return this.forms.schemesForm.at(index).get('oauthFlow')?.value ?? 'authorizationCode';
  }
}

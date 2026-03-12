import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';

@Component({
  selector: 'app-security',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
})
export class SecurityComponent {
  readonly securityTypes = ['apiKey', 'http', 'oauth2', 'openIdConnect'];
  readonly apiKeyLocations = ['header', 'query', 'cookie'];
  readonly httpSchemes = ['bearer', 'basic', 'digest'];

  constructor(public forms: OpenApiFormsService) {}

  getType(index: number): string {
    return this.forms.schemesForm.at(index).get('type')?.value ?? 'apiKey';
  }
}

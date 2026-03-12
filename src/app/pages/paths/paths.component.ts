import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { OpenApiStateService } from '../../services/open-api-state.service';

@Component({
  selector: 'app-paths',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './paths.component.html',
  styleUrl: './paths.component.scss',
})
export class PathsComponent {
  readonly methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  readonly paramTypes = ['string', 'integer', 'number', 'boolean'];

  constructor(public forms: OpenApiFormsService, public state: OpenApiStateService) {}

  syncPathParams(pathIndex: number, pathValue: string) {
    const names = [...pathValue.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
    this.forms.syncPathParams(pathIndex, names);
  }
}

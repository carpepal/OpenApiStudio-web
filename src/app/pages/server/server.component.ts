import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';

@Component({
  selector: 'app-server',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './server.component.html',
  styleUrl: './server.component.scss',
})
export class ServerComponent {
  constructor(public forms: OpenApiFormsService) {}
}

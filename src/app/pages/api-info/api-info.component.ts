import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-api-info',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './api-info.component.html',
  styleUrl: './api-info.component.scss',
})
export class ApiInfoComponent {
  constructor(public forms: OpenApiFormsService) {}
}

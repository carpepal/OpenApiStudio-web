import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';

@Component({
  selector: 'app-tags',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent {
  constructor(public forms: OpenApiFormsService) {}
}

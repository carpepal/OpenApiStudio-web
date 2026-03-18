import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { LucideAngularModule, Tag, Plus, Trash2, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-tags',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Tag, Plus, Trash2 }) }],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent {
  constructor(public forms: OpenApiFormsService) {}
}

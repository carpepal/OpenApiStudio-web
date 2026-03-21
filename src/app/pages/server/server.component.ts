import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { LucideAngularModule, Trash2, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-server',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Trash2 }) }],
  templateUrl: './server.component.html',
  styleUrl: './server.component.scss',
})
export class ServerComponent {
  constructor(public forms: OpenApiFormsService) {}
}

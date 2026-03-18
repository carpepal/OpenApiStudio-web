import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { LucideAngularModule, Server, Plus, Trash2, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-server',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Server, Plus, Trash2 }) }],
  templateUrl: './server.component.html',
  styleUrl: './server.component.scss',
})
export class ServerComponent {
  constructor(public forms: OpenApiFormsService) {}
}

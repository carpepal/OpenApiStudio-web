import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { OpenApiStateService } from '../../services/open-api-state.service';
import { LucideAngularModule, Plus, Trash2, CircleCheck, TriangleAlert, CircleAlert, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-paths',
  imports: [MainComponent, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Plus, Trash2, CircleCheck, TriangleAlert, CircleAlert }) }],
  templateUrl: './paths.component.html',
  styleUrl: './paths.component.scss',
})
export class PathsComponent {
  readonly methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  readonly paramTypes = ['string', 'integer', 'number', 'boolean'];
  readonly queryParamStyles = ['form', 'spaceDelimited', 'pipeDelimited', 'deepObject'];

  readonly methodBadgeClasses: Record<string, string> = {
    get: 'bg-badge-green-bg text-badge-green-text',
    post: 'bg-badge-blue-bg text-badge-blue-text',
    put: 'bg-badge-amber-bg text-badge-amber-text',
    patch: 'bg-badge-purple-bg text-badge-purple-text',
    delete: 'bg-badge-red-bg text-badge-red-text',
    head: 'bg-badge-slate-bg text-badge-slate-text',
    options: 'bg-badge-slate-bg text-badge-slate-text',
  };

  constructor(public forms: OpenApiFormsService, public state: OpenApiStateService) {}

  syncPathParams(pathIndex: number, pathValue: string) {
    const names = [...pathValue.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
    this.forms.syncPathParams(pathIndex, names);
  }

  onPathInput(pathIndex: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.syncPathParams(pathIndex, inputElement.value);
  }

  onMethodChange(pathIndex: number, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const method = selectElement.value;
    if (this.forms.isMethodWithoutBody(method)) {
      this.forms.clearRequestBody(pathIndex);
    }
  }

  getMethodBadgeClass(method: string): string {
    return this.methodBadgeClasses[method] ?? 'bg-badge-slate-bg text-badge-slate-text';
  }
}

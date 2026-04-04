import { AfterViewInit, Component, DestroyRef, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
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
export class PathsComponent implements AfterViewInit {
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

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor(public forms: OpenApiFormsService, public state: OpenApiStateService) {}

  ngAfterViewInit(): void {
    // Schedule the initial re-apply via afterNextRender so that signal-driven
    // @for blocks (tagNames, schemeNames) have already rendered their <option>
    // elements and registered them in SelectMultipleControlValueAccessor._optionMap
    // before writeValue is called. In Angular 19, signal-based rendering runs in
    // a separate cycle from ngAfterViewInit, so a direct call here is too early.
    afterNextRender(() => this.reapplyMultiSelects(), { injector: this.injector });

    // Re-apply after any structural change to pathsForm (e.g. a new import
    // while the user is already on this page). debounceTime(0) batches rapid
    // emissions; afterNextRender ensures Angular has already re-rendered the
    // @for <option> elements before we call writeValue.
    this.forms.pathsForm.valueChanges
      .pipe(debounceTime(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        afterNextRender(() => this.reapplyMultiSelects(), { injector: this.injector });
      });
  }

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

  /**
   * Re-patches tags and security on every path group using { emitEvent: false }
   * to avoid triggering valueChanges again. This forces Angular's
   * SelectMultipleControlValueAccessor to call writeValue a second time,
   * now that the @for-rendered <option> elements are registered.
   */
  private reapplyMultiSelects(): void {
    this.forms.pathsForm.controls.forEach((ctrl) => {
      const g = ctrl as FormGroup;
      g.patchValue(
        { tags: g.get('tags')?.value ?? [], security: g.get('security')?.value ?? [] },
        { emitEvent: false },
      );
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Info, Server, Route, Tag, Shield, Braces, Puzzle, LifeBuoy, AlertTriangle, Search, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { SearchModalComponent } from '../search-modal/search-modal.component';
import { environment } from '../../../environments/environment';

interface SidebarNavItem {
  readonly routePath: string;
  readonly label: string;
  readonly iconName: string;
  readonly isMandatory?: boolean;
}

interface SidebarNavSection {
  readonly sectionLabel: string;
  readonly items: ReadonlyArray<SidebarNavItem>;
}

@Component({
  selector: 'app-aside',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, SearchModalComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Info, Server, Route, Tag, Shield, Braces, Puzzle, LifeBuoy, AlertTriangle, Search }) }],
  templateUrl: './aside.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideComponent {
  private readonly formsService = inject(OpenApiFormsService);

  @ViewChild('searchModal') searchModal!: SearchModalComponent;

  openSearch(): void {
    this.searchModal.open();
  }

  private readonly apiInfoValue = toSignal(
    this.formsService.apiInfoForm.valueChanges,
    { initialValue: this.formsService.apiInfoForm.value }
  );

  readonly isApiInfoFilled = computed(() => {
    const value = this.apiInfoValue();
    return !!(value.title?.trim() && value.version?.trim());
  });

  readonly navigationSections: SidebarNavSection[] = [
    {
      sectionLabel: 'CORE',
      items: [
        { routePath: '/api-info', label: 'API Info', iconName: 'info', isMandatory: true },
        { routePath: '/server', label: 'Servers', iconName: 'server' },
        { routePath: '/tags', label: 'Tags', iconName: 'tag' },
        { routePath: '/paths', label: 'Paths', iconName: 'route' },
        { routePath: '/security', label: 'Security', iconName: 'shield' },
      ],
    },
    {
      sectionLabel: 'SCHEMAS',
      items: [
        { routePath: '/schemas', label: 'Schemas', iconName: 'braces' },
      ],
    },
  ];

  readonly appVersion = environment.version;
}

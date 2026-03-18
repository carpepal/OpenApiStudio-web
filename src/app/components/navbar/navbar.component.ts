import { Component, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LucideAngularModule, Eye, Sun, Moon, Upload, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { ImportModalComponent } from '../import-modal/import-modal.component';

@Component({
  selector: 'app-navbar',
  imports: [LucideAngularModule, ImportModalComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Eye, Sun, Moon, Upload }) }],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  @Output() togglePreview = new EventEmitter<void>();

  @ViewChild('importModal') importModal!: ImportModalComponent;

  private readonly themeService = inject(ThemeService);
  readonly isDark = this.themeService.isDark;

  onTogglePreview() {
    this.togglePreview.emit();
  }

  onToggleTheme() {
    this.themeService.toggleTheme();
  }

  openImport(): void {
    this.importModal.open();
  }
}

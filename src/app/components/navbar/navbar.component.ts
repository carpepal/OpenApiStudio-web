import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LucideAngularModule, Eye, Sun, Moon, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  imports: [LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Eye, Sun, Moon }) }],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  @Output() togglePreview = new EventEmitter<void>();

  private readonly themeService = inject(ThemeService);
  readonly isDark = this.themeService.isDark;

  onTogglePreview() {
    this.togglePreview.emit();
  }

  onToggleTheme() {
    this.themeService.toggleTheme();
  }
}

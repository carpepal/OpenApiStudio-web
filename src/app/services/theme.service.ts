import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<ThemeMode>(this.getStoredTheme());
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.applyThemeToDocument(this.currentTheme());
    effect(() => {
      const theme = this.currentTheme();
      this.applyThemeToDocument(theme);
      this.persistTheme(theme);
    });
  }

  toggleTheme(): void {
    this.currentTheme.update(current => current === 'light' ? 'dark' : 'light');
  }

  private getStoredTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch (error) {
      console.warn('Error al leer tema desde localStorage:', error);
    }
    return 'light';
  }

  private applyThemeToDocument(theme: ThemeMode): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private persistTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Error al guardar tema en localStorage:', error);
    }
  }
}

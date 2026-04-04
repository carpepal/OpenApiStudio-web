import { Signal, WritableSignal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export abstract class ThemeService {
  abstract readonly currentTheme: WritableSignal<ThemeMode>;
  abstract readonly isDark: Signal<boolean>;
  abstract toggleTheme(): void;
}

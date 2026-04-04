import { Injectable, signal, computed, inject } from '@angular/core';
import { ThemeService, ThemeMode } from './theme.service';
import { VscodeMessageBridgeService } from '../vscode-message-bridge.service';

@Injectable()
export class VscodeThemeService extends ThemeService {
  readonly currentTheme = signal<ThemeMode>('light');
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    super();
    const bridge = inject(VscodeMessageBridgeService);
    bridge.onMessage('themeChanged', (payload) => {
      const { kind } = payload as { kind: 'light' | 'dark' };
      this.applyTheme(kind);
    });
  }

  toggleTheme(): void {
    // Theme is controlled by VS Code; toggling is a no-op
  }

  private applyTheme(kind: 'light' | 'dark'): void {
    this.currentTheme.set(kind);
    if (kind === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

import { StorageService } from './services/storage/storage.service';
import { LocalStorageService } from './services/storage/local-storage.service';
import { VscodeStorageService } from './services/storage/vscode-storage.service';

import { ThemeService } from './services/theme/theme.service';
import { BrowserThemeService } from './services/theme/browser-theme.service';
import { VscodeThemeService } from './services/theme/vscode-theme.service';

import { ClipboardService } from './services/clipboard/clipboard.service';
import { BrowserClipboardService } from './services/clipboard/browser-clipboard.service';
import { VscodeClipboardService } from './services/clipboard/vscode-clipboard.service';

import { FileExportService } from './services/file-export/file-export.service';
import { BrowserFileExportService } from './services/file-export/browser-file-export.service';
import { VscodeFileExportService } from './services/file-export/vscode-file-export.service';

import { FileImportService } from './services/file-import/file-import.service';
import { BrowserFileImportService } from './services/file-import/browser-file-import.service';
import { VscodeFileImportService } from './services/file-import/vscode-file-import.service';

import { VscodeMessageBridgeService } from './services/vscode-message-bridge.service';

const isVsCode = typeof (window as any).vscodeApi !== 'undefined';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
      withHashLocation(),
    ),
    { provide: StorageService, useClass: isVsCode ? VscodeStorageService : LocalStorageService },
    { provide: ThemeService, useClass: isVsCode ? VscodeThemeService : BrowserThemeService },
    { provide: ClipboardService, useClass: isVsCode ? VscodeClipboardService : BrowserClipboardService },
    { provide: FileExportService, useClass: isVsCode ? VscodeFileExportService : BrowserFileExportService },
    { provide: FileImportService, useClass: isVsCode ? VscodeFileImportService : BrowserFileImportService },
    ...(isVsCode
      ? [
          VscodeMessageBridgeService,
          {
            provide: APP_INITIALIZER,
            useFactory: (bridge: VscodeMessageBridgeService) => () => bridge,
            deps: [VscodeMessageBridgeService],
            multi: true,
          },
        ]
      : []),
  ],
};

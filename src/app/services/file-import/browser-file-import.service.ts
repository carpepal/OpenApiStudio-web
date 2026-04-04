import { Injectable } from '@angular/core';
import { FileImportService } from './file-import.service';

@Injectable()
export class BrowserFileImportService extends FileImportService {
  pickAndReadFile(): Promise<{ content: string; fileName: string } | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.yaml,.yml';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result as string;
          resolve({ content, fileName: file.name });
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }
}

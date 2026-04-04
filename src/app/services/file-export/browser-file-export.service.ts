import { Injectable } from '@angular/core';
import { FileExportService } from './file-export.service';

@Injectable()
export class BrowserFileExportService extends FileExportService {
  download(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

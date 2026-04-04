import { Injectable } from '@angular/core';
import { ClipboardService } from './clipboard.service';

@Injectable()
export class BrowserClipboardService extends ClipboardService {
  async writeText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
}

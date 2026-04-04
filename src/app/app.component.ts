import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PreviewComponent } from './components/preview/preview.component';
import { AsideComponent } from './components/aside.component/aside.component';
import { SpecPersistenceService } from './services/spec-persistence.service';
import { FileChangedModalComponent } from './components/file-changed-modal/file-changed-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, PreviewComponent, AsideComponent, FileChangedModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'open-api-studio-web';
  private readonly persistence = inject(SpecPersistenceService);

  constructor() {
    if (this.persistence.hasSavedSpec()) {
      this.persistence.restoreSaved();
    }
  }
  readonly activePreview = signal(false);
  readonly previewWidth = signal(380);
  readonly isResizing = signal(false);
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  togglePreview() {
    this.activePreview.update(value => !value);
  }

  startResize(event: MouseEvent) {
    this.isResizing.set(true);
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.previewWidth();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing()) return;
    const delta = this.resizeStartX - event.clientX;
    this.previewWidth.set(Math.max(200, Math.min(900, this.resizeStartWidth + delta)));
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isResizing.set(false);
  }
}

import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PreviewComponent } from './components/preview/preview.component';
import { AsideComponent } from './components/aside.component/aside.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, PreviewComponent, AsideComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'open-api-studio-web';
  activePreview = false;
  previewWidth = 380;
  isResizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  togglePreview() {
    this.activePreview = !this.activePreview;
  }

  startResize(event: MouseEvent) {
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.previewWidth;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    const delta = this.resizeStartX - event.clientX;
    this.previewWidth = Math.max(200, Math.min(900, this.resizeStartWidth + delta));
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isResizing = false;
  }
}

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  @Output() togglePreview = new EventEmitter<void>();

  onTogglePreview() {
    this.togglePreview.emit();
  }
}

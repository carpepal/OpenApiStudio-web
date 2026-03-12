import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button',
  imports: [RouterLink],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input({ required: true }) label: string = 'Button';
  @Input({ required: true }) type: 'link' | 'button' = 'button';
  @Input() link: string = '#';
  @Output() pressed = new EventEmitter<void>();

  onClick() {
    this.pressed.emit();
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-editor',
  imports: [],
  styleUrl: './editor.component.scss',
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {}

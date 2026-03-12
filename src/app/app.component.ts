import { Component } from '@angular/core';
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
  activePreview: boolean = false;

  togglePreview() {
    this.activePreview = !this.activePreview;
  }
}

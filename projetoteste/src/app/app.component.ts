import { OutroModelo } from './modelos/outro-modelo.model';
import { Armario } from './modelos/armario.model';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  armario: Armario | OutroModelo;
}

import { Component } from '@angular/core';
import { UserTableComponent } from './user-table/user-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserTableComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'user-table-app';
}

import { Component } from '@angular/core';

import { SocketioService } from '@services/socketio/socketio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ecclesia-activity-day';

  constructor(private readonly socketService: SocketioService) {}

  ngOnInit() {
    this.socketService.setupSocketConnection();
  }
}

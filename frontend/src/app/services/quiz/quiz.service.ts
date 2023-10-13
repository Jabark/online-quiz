import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';

import { SocketioService } from '@services/socketio/socketio.service';
import { IAnswer, IContestant, ITracker } from '@shared';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly _currentContestant: BehaviorSubject<IContestant> =
    new BehaviorSubject<IContestant>(null!);
  private readonly _stageData: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(
    private readonly cookieService: CookieService,
    private readonly socketIO: SocketioService
  ) {}

  get isPaused(): Observable<boolean> {
    this.socketIO.socket.emit('get-pause-state');

    return new Observable<boolean>((observer) => {
      this.socketIO.socket.on('send-pause-state', (value: boolean) => {
        observer.next(value);
      });
    });
  }

  get currentContestant(): Observable<IContestant> {
    return this._currentContestant.asObservable();
  }

  get stageData(): Observable<any> {
    return this._stageData.asObservable();
  }

  get quizTracker(): Observable<ITracker> {
    this.socketIO.socket.emit('get-tracker');

    return new Observable<ITracker>((observer) => {
      this.socketIO.socket.on('send-tracker', (t: ITracker) => {
        observer.next(t);
      });
    });
  }

  setCurrentContestant(contestant: IContestant): void {
    this._currentContestant.next(contestant);
  }

  startQuiz(): void {
    this.socketIO.socket.emit('start-quiz');
  }

  getAllContestants(): Observable<IContestant[]> {
    this.socketIO.socket.emit('request-contestants');

    return new Observable<IContestant[]>((observer) => {
      this.socketIO.socket.on(
        'send-contestants',
        (contestants: IContestant[]) => {
          observer.next(contestants);
        }
      );
    });
  }

  completeNewContestant(contestant: IContestant): void {
    this.socketIO.socket.emit('complete-contestant', contestant);

    this.socketIO.socket.once('send-contestant-id', (id: string) => {
      this.cookieService.set('Current Contestant', id, { expires: 1 });
    });

    this._currentContestant.next(undefined!);
  }

  updateContestantScore(id: number, score: number): void {
    this.socketIO.socket.emit('update-contestant-score', { id, score });
  }

  updateAnswer(answer: IAnswer): void {
    this.socketIO.socket.emit('update-answer', answer);
  }

  async retrieveCorrectness(id: number): Promise<IAnswer> {
    this.socketIO.socket.emit('retrieve-correctness', id);

    return new Promise((resolve) => {
      this.socketIO.socket.once('send-correctness', async (answer: IAnswer) => {
        resolve(answer);
      });
    });
  }

  pauseStateChange(): void {
    this.socketIO.socket.emit('pause-state-change');
  }
}

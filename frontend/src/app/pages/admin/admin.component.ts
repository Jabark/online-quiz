import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

import { QuizService } from '@services/quiz/quiz.service';
import { IContestant, ITracker, Phase } from '@shared';

@Component({
  selector: 'app-admin',
  styleUrls: ['./admin.component.scss'],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  isPaused = false;
  tracker!: ITracker;
  contestants: IContestant[] = [];
  form!: FormGroup;

  constructor(
    private readonly cookieService: CookieService,
    private readonly quizSvc: QuizService,
    private readonly fb: FormBuilder
  ) {}

  get isIntroPhase(): boolean {
    return this.tracker?.phase === Phase.INTRO;
  }

  get isQuestionPhase(): boolean {
    return this.tracker?.phase === Phase.QUESTION;
  }

  get currentRound(): number {
    return this.tracker?.round.ID;
  }

  get passwordCorrect(): boolean {
    return this.cookieService.get('Password Correct') === 'true';
  }

  ngOnInit(): void {
    if (this.passwordCorrect) {
      this.initiateAdmin();
    } else {
      this.form = this.fb.group({});
      this.form.addControl(
        'password',
        this.fb.control('', Validators.required)
      );
    }
  }

  initiateAdmin(): void {
    this.quizSvc.quizTracker.subscribe((tracker: ITracker) => {
      this.tracker = tracker;
    });

    this.quizSvc.getAllContestants().subscribe((contestants: IContestant[]) => {
      this.form = this.fb.group({});
      this.contestants = contestants;

      this.contestants.forEach((contestant: IContestant) => {
        this.form.addControl(
          `Contestant${contestant.id}`,
          this.fb.control(contestant.points, Validators.required)
        );
      });
    });

    this.quizSvc.isPaused.subscribe((isPaused) => {
      this.isPaused = isPaused;
    });
  }

  changeScore(id: number) {
    this.quizSvc.updateContestantScore(id, this.form.value[`Contestant${id}`]);
  }

  startQuiz(): void {
    this.quizSvc.startQuiz();
  }

  pauseQuiz(): void {
    this.quizSvc.pauseStateChange();
  }

  enterPassword(): void {
    if (this.form.controls['password'].value === 'StarWarsCoffee') {
      this.cookieService.set('Password Correct', 'true');
      this.initiateAdmin();
    }
  }
}

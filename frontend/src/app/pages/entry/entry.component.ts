import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { QuizService } from '@services/quiz/quiz.service';
import { IContestant, ITracker } from '@shared';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
})
export class EntryComponent implements OnInit {
  contestant!: IContestant;
  placeholder = 'Enter your name';
  form!: FormGroup;
  isComplete = false;

  constructor(
    private readonly cookieService: CookieService,
    readonly quizSvc: QuizService,
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.quizSvc.quizTracker.subscribe((tracker: ITracker) => {
      if (tracker.round.ID && this.cookieService.get('Current Contestant')) {
        this.router.navigate(['/round', tracker.round.ID]);
      }
    });

    if (this.cookieService.get('Current Contestant')) {
      this.isComplete = true;
    } else {
      this.quizSvc.setCurrentContestant({
        id: 0,
        name: '',
        points: 10,
      });

      this.quizSvc.currentContestant.subscribe((contestant: IContestant) => {
        this.contestant = contestant;
      });

      this.form = this.fb.group({
        name: [this.contestant.name, Validators.required],
      });

      this.form.valueChanges.subscribe((value) => {
        if (value && this.contestant) {
          this.quizSvc.setCurrentContestant(
            Object.assign(this.contestant, value)
          );
        }
      });
    }
  }

  submitContestant() {
    this.quizSvc.completeNewContestant(this.contestant);
    this.isComplete = true;
    this.form.reset();
    this.form.disable();
  }
}

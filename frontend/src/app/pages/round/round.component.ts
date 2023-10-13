import {
  Component,
  ElementRef,
  HostBinding,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { QuizService } from '@services/quiz/quiz.service';
import { IContestant, ITracker, Phase, RoundType } from '@shared';
import { CookieService } from 'ngx-cookie-service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-round',
  styleUrls: ['./round.component.scss'],
  templateUrl: './round.component.html',
})
export class RoundComponent implements OnInit {
  @HostBinding('class') class = 'qtApp-route';
  @ViewChild('audioCorrect') audioCorrect!: ElementRef<HTMLAudioElement>;
  @ViewChild('audioWrong') audioWrong!: ElementRef<HTMLAudioElement>;
  @ViewChild('audioChampion') audioChampion!: ElementRef<HTMLAudioElement>;

  contestantID = 0;
  isPaused = false;
  roundID!: number;
  tracker!: ITracker;
  form!: FormGroup;
  correctAnswers!: string[];
  winningContestants!: IContestant[];
  hasPlayedEnding = false;
  userAnswer!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly quizSvc: QuizService,
    private readonly fb: FormBuilder,
    private readonly cookieService: CookieService
  ) {}

  get winningContestantNames() {
    return this.winningContestants
      .map((contestant) => contestant.name)
      .join(', ');
  }

  get timer(): string {
    const tl = this.tracker.timeLeft;

    if (tl > 60) {
      const mins = Math.floor(tl / 60);

      return `${mins}:${`0${tl - mins * 60}`.slice(-2)}`;
    }
    return tl.toString();
  }

  ngOnInit(): void {
    this.contestantID = parseInt(
      this.cookieService.get('Current Contestant'),
      10
    );
    this.form = this.fb.group({});

    this.route.params.subscribe((params) => {
      this.roundID = parseInt(params['roundID'], 10);
    });

    this.quizSvc.quizTracker.subscribe((tracker: ITracker) => {
      if (this.roundID === tracker.round.ID) {
        if (
          tracker.phase === Phase.QUESTION &&
          this.tracker?.phase !== Phase.QUESTION
        ) {
          if (
            tracker.stageData?.length &&
            tracker.round.RoundType === RoundType.MULTIPLE
          ) {
            (tracker.stageData as string[]).forEach((_, index) => {
              if (this.form.controls?.[`Answer${index + 1}`]) {
                this.form.controls[`Answer${index + 1}`].setValue('');
              } else {
                this.form.addControl(`Answer${index + 1}`, this.fb.control(''));
              }
            });
          } else {
            if (this.form.controls?.['Answer1']) {
              this.form.controls['Answer1'].setValue('');
            } else {
              this.form.addControl('Answer1', this.fb.control(''));
            }
          }

          this.quizSvc.updateAnswer({
            answer: this.form.value,
            id: this.contestantID,
          });
        }

        if (
          tracker.phase === Phase.ANSWER &&
          this.tracker?.phase !== Phase.ANSWER
        ) {
          this.quizSvc.retrieveCorrectness(this.contestantID).then((answer) => {
            this.correctAnswers = answer.answer?.correct || [];
            Object.keys(answer.answer as any).forEach((key) => {
              const a = answer.answer?.[key] || ' ';

              if (key !== 'correct') {
                if (this.form.controls?.[key]) {
                  this.form.controls[key].setValue(a);
                } else {
                  this.form.addControl(key, this.fb.control(a));
                }
              }
            });

            if (
              this.tracker.round.RoundType !== RoundType.MULTIPLE &&
              this.tracker.round.RoundType !== RoundType.GRID
            ) {
              if (this.correctAnswers?.includes(`Answer1`)) {
                this.audioCorrect.nativeElement.play();
              } else {
                this.audioWrong.nativeElement.play();
              }
            }

            if (this.tracker.round.RoundType === RoundType.GRID) {
              this.userAnswer = answer.answer?.['Answer1'].toString() || '';
            }
          });
        }
      } else if (!tracker.round.ID) {
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/round', tracker.round.ID]);
      }

      if (tracker.round.ID < 0) {
        this.quizSvc
          .getAllContestants()
          .subscribe((contestants: IContestant[]) => {
            const topScore = Math.max(
              ...contestants.map((contestant) => contestant.points)
            );

            this.winningContestants = contestants.filter(
              (contestant) => contestant.points === topScore
            );

            if (!this.hasPlayedEnding) {
              if (
                this.winningContestants
                  .map((contestant) => contestant.id)
                  .includes(this.contestantID)
              ) {
                this.audioChampion.nativeElement.play();
              }
            } else {
              this.hasPlayedEnding = true;
            }
          });
      }

      this.tracker = tracker;
    });

    this.form.valueChanges.subscribe((answer) => {
      if (this.tracker?.phase === Phase.QUESTION) {
        this.quizSvc.updateAnswer({
          answer,
          id: this.contestantID,
        });
      }
    });

    this.quizSvc.isPaused.subscribe((isPaused) => {
      this.isPaused = isPaused;
    });
  }

  checkRange() {
    const correctAnswerPart = this.correctAnswers[0].split('');
    const userAnswerPart = this.userAnswer.split('');
    const range = Math.max(
      Math.abs(+userAnswerPart[0] - +correctAnswerPart[0]),
      Math.abs(+userAnswerPart[1] - +correctAnswerPart[1])
    );
    return range === 0 ? 3 : range === 1 ? 1 : 0;
  }

  isCorrect(i: number): boolean {
    return this.correctAnswers?.includes(`Answer${i}`);
  }

  isCorrectCell(value: string): boolean {
    return this.correctAnswers?.includes(value);
  }

  splitStageData(str: any): string[] {
    return str.split('|');
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.body.requestFullscreen();
    }
  }
}

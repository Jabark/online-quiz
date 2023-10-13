import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { QuizService } from '@services/quiz/quiz.service';
import { IContestant, ITracker, Phase, RoundType } from '@shared';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChild('audioCountdown') audioCountdown!: ElementRef<HTMLAudioElement>;
  @ViewChild('audioElevator') audioElevator!: ElementRef<HTMLAudioElement>;
  tracker!: ITracker;
  homeURL = 'http://192.168.1.199:4200';
  isPaused = false;
  initiated = false;
  winningContestants!: IContestant[];
  introPlayed: number[] = [];
  questionPlayed: string[] = [];
  answerPlayed: string[] = [];

  constructor(private readonly quizSvc: QuizService) {}

  get winningContestantNames() {
    return this.winningContestants
      .map((contestant) => contestant.name)
      .join(', ');
  }

  get isIntroPhase(): boolean {
    return this.tracker?.phase === Phase.INTRO;
  }

  get isQuestionPhase(): boolean {
    return this.tracker?.phase === Phase.QUESTION;
  }

  get isAnswerPhase(): boolean {
    return this.tracker?.phase === Phase.ANSWER;
  }

  get currentRound(): number {
    return this.tracker?.round.ID;
  }

  ngOnInit(): void {
    this.quizSvc.quizTracker.subscribe((tracker: ITracker) => {
      this.tracker = tracker;
      if (
        this.isIntroPhase &&
        tracker.round.ID > 0 &&
        !this.introPlayed.includes(tracker.round.ID)
      ) {
        this.introPlayed.push(tracker.round.ID);
        this.TTS(tracker.round.Name + ': ' + tracker.round.Description || '');
      }

      if (this.isQuestionPhase) {
        if (tracker.round.RoundType === RoundType.GRID) {
          if (
            !this.questionPlayed.includes(
              tracker.round.ID.toString() + tracker.step.toString()
            )
          ) {
            this.questionPlayed.push(
              tracker.round.ID.toString() + tracker.step.toString()
            );
            this.TTS(this.splitStageData(tracker.stageData)[1]);
          }
        }
      }

      if (this.isAnswerPhase) {
        if (tracker.round.RoundType === RoundType.MULTIPLE) {
          if (
            !this.answerPlayed.includes(
              tracker.round.ID.toString() + tracker.step.toString()
            )
          ) {
            let strSpeak = '';
            this.answerPlayed.push(
              tracker.round.ID.toString() + tracker.step.toString()
            );
            (tracker.stageData as []).forEach((data: string, i: number) => {
              const answer = data.split(' = ')[1];
              strSpeak += `${i + 1}: ${answer}, `;
            });
            this.TTS(strSpeak);
          }
        }
        if (tracker.round.RoundType === RoundType.PICTURE) {
          if (
            !this.answerPlayed.includes(
              tracker.round.ID.toString() + tracker.step.toString()
            )
          ) {
            this.answerPlayed.push(
              tracker.round.ID.toString() + tracker.step.toString()
            );
            this.TTS((tracker.stageData as string).split('|')[1]);
          }
        }
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
          });
      }

      this.setCountdown();
      this.playCountdown();
    });

    this.quizSvc.isPaused.subscribe((isPaused) => {
      const elevatorAudio = this.audioElevator.nativeElement;

      this.isPaused = isPaused;
      if (isPaused) {
        elevatorAudio.play();
      } else {
        elevatorAudio.pause();
      }

      this.setCountdown();
      this.playCountdown();
    });
  }

  initiator(): void {
    this.initiated = true;
  }

  splitStageData(str: any): string[] {
    return str.split('|');
  }

  private TTS(text: string, volume?: number, rate?: number, pitch?: number) {
    let synthesis = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'en-GB';
    utterance.rate = rate || 1;
    utterance.pitch = pitch || 1;
    utterance.volume = volume || 2;
    synthesis.cancel();

    return synthesis.speak(utterance);
  }

  private setCountdown() {
    if (this.tracker?.phase === Phase.QUESTION && this.tracker.timeLeft < 31) {
      const el = this.audioCountdown.nativeElement;

      if (el.paused) {
        if (this.tracker.timeLeft > el.currentTime) {
          el.currentTime = 30 - this.tracker.timeLeft;
        }
      }
    }
  }

  private playCountdown() {
    if (this.tracker?.phase === Phase.QUESTION && this.tracker.timeLeft < 31) {
      const el = this.audioCountdown.nativeElement;

      if (this.isPaused) {
        el.pause();
      } else {
        el.play();
      }
    }
  }
}

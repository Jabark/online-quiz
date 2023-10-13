import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { QuizService } from '@services/quiz/quiz.service';
import { IContestant } from '@shared';

@Component({
  selector: 'app-scores',
  styleUrls: ['./scores.component.scss'],
  templateUrl: './scores.component.html',
})
export class ScoresComponent implements OnInit {
  @ViewChild(BaseChartDirective)
  chart!: BaseChartDirective;

  contestants: IContestant[] = [];
  barChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        ticks: {
          stepSize: 1,
        },
      },
    },
  };
  barChartLegend = false;
  barChartData: ChartConfiguration<'bar'>['data'] = {
    datasets: [],
  };
  barChartPlugins = [];

  constructor(readonly quizSvc: QuizService) {}

  ngOnInit(): void {
    this.barChartData = {
      labels: [],
      datasets: [
        {
          data: [],
        },
      ],
    };

    this.quizSvc.getAllContestants().subscribe((contestants: IContestant[]) => {
      this.contestants = contestants;
      this.barChartData.labels = contestants.map(
        (contestant) => contestant.name
      );
      this.barChartData.datasets[0].data = contestants.map(
        (contestant) => contestant.points
      );
      this.barChartData.datasets[0].backgroundColor = this.getColors(
        contestants.length
      );
      this.chart.chart?.update();
    });
  }

  private getColors(len: number) {
    const eq1 = 55;
    const eq2 = 200;
    const frequency = (Math.PI * 2) / len;

    var cvparr = [];
    for (var i = 0; i < len; ++i) {
      const red = Math.sin(frequency * i + 2) * eq1 + eq2;
      const green = Math.sin(frequency * i + 0) * eq1 + eq2;
      const blue = Math.sin(frequency * i + 4) * eq1 + eq2;

      cvparr.push(
        `#${this.rgbToHex(
          Math.round(red),
          Math.round(green),
          Math.round(blue)
        )}`
      );
    }
    return cvparr;
  }

  private rgbToHex(r: number, g: number, b: number) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}

import { NgModule } from '@angular/core';

import { NgChartsModule } from 'ng2-charts';

import { ScoresComponent } from './scores.component';

@NgModule({
  declarations: [ScoresComponent],
  exports: [ScoresComponent],
  imports: [NgChartsModule],
})
export class ScoresModule {}

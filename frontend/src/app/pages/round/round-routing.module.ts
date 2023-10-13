import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoundComponent } from './round.component';

const routes: Routes = [{ path: '', component: RoundComponent }];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forChild(routes)],
})
export class RoundRoutingModule {}

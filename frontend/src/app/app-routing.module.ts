import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./pages/admin/admin.module').then((a) => a.AdminModule),
  },
  {
    path: 'round/:roundID',
    loadChildren: () =>
      import('./pages/round/round.module').then((a) => a.RoundModule),
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.module').then((a) => a.HomeModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./pages/entry/entry.module').then((a) => a.EntryModule),
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {}

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'analytics',
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'importar-csv',
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'nuevo-registro',
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'datos-mysql',
        loadComponent: () => import('../tab4/tab4.page').then((m) => m.Tab4Page),
      },
      {
        path: 'comparativa',
        loadComponent: () => import('../comparativa/comparativa.page').then((m) => m.ComparativaPage),
      },
      {
        path: '',
        redirectTo: '/tabs/analytics',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/analytics',
    pathMatch: 'full',
  },
];

import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin.component';
import { LoginComponent } from './pages/login.component';
import { TiendaComponent } from './pages/tienda.component';
import { roleGuard } from './guards/role.guard';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [
      () => {
        const auth = inject(AuthService);
        const router = inject(Router);
        return auth.isAuthenticated()
          ? router.createUrlTree([auth.homeFor()])
          : true;
      },
    ],
  },
  { path: 'admin', component: AdminComponent, canActivate: [roleGuard('admin')] },
  { path: 'tienda', component: TiendaComponent, canActivate: [roleGuard('cliente')] },
  { path: '**', redirectTo: '' },
];

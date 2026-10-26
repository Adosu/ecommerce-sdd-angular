import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export function roleGuard(role: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/']);
    }
    const user = auth.getUser();
    if (user?.rol !== role) {
      return router.createUrlTree([auth.homeFor(user)]);
    }
    return true;
  };
}

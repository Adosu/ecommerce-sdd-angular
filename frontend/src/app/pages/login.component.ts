import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="auth-shell">
      <section class="auth-intro">
        <div class="brand brand-light"><span class="brand-mark">N</span> norte<span>.</span></div>
        <div class="intro-copy">
          <span class="eyebrow">COMERCIO CON PROPÓSITO</span>
          <h1>Todo lo que buscas,<br>en un solo lugar.</h1>
          <p>Una experiencia de compra simple, con productos seleccionados para acompañarte cada día.</p>
        </div>
        <div class="intro-foot"><span class="status-dot"></span> Plataforma de ventas · Demo en vivo</div>
      </section>

      <section class="auth-panel">
        <div class="auth-card">
          <div class="brand brand-dark"><span class="brand-mark">N</span> norte<span>.</span></div>
          <div class="auth-heading">
            <p class="eyebrow">{{ isRegister ? 'ÚNETE A NORTE' : 'BIENVENIDO DE NUEVO' }}</p>
            <h2>{{ isRegister ? 'Crea tu cuenta' : 'Inicia sesión' }}</h2>
            <p class="muted">{{ isRegister ? 'Completa tus datos para comenzar.' : 'Ingresa tus credenciales para continuar.' }}</p>
          </div>

          <form (ngSubmit)="submit()" #authForm="ngForm">
            @if (isRegister) {
              <label>Nombre completo
                <input name="nombre" [(ngModel)]="nombre" required placeholder="Tu nombre">
              </label>
            }
            <label>Correo electrónico
              <input name="correo" type="email" [(ngModel)]="correo" required email placeholder="nombre@correo.com">
            </label>
            <label>Contraseña
              <input name="password" type="password" [(ngModel)]="password" required placeholder="••••••••">
            </label>
            @if (error) { <div class="alert error-alert">{{ error }}</div> }
            @if (notice) { <div class="alert success-alert">{{ notice }}</div> }
            <button class="button button-primary full-button" type="submit" [disabled]="loading || authForm.invalid">
              {{ loading ? 'Procesando…' : (isRegister ? 'Crear cuenta' : 'Entrar a mi cuenta') }}
              @if (!loading) { <span aria-hidden="true">→</span> }
            </button>
          </form>

          @if (!isRegister) {
            <div class="demo-box">
              <div class="demo-title"><span>✦</span> Acceso rápido para demostración</div>
              <button type="button" class="demo-account" (click)="useDemo('admin')">
                <span class="demo-avatar admin-avatar">A</span>
                <span><strong>Administrador</strong><small>admin&#64;ecommerce.com · admin123</small></span>
                <span class="demo-arrow">↗</span>
              </button>
              <button type="button" class="demo-account" (click)="useDemo('cliente')">
                <span class="demo-avatar client-avatar">C</span>
                <span><strong>Cliente de prueba</strong><small>cliente&#64;ecommerce.com · cliente123</small></span>
                <span class="demo-arrow">↗</span>
              </button>
            </div>
          }

          <p class="auth-switch">
            {{ isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?' }}
            <button type="button" class="text-button" (click)="toggleMode()">{{ isRegister ? 'Inicia sesión' : 'Regístrate' }}</button>
          </p>
        </div>
        <p class="copyright">© 2026 Norte Commerce. Experiencia de compra con confianza.</p>
      </section>
    </main>
  `,
})
export class LoginComponent {
  isRegister = false;
  nombre = '';
  correo = '';
  password = '';
  loading = false;
  error = '';
  notice = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  useDemo(role: UserRole): void {
    this.correo = role === 'admin' ? 'admin@ecommerce.com' : 'cliente@ecommerce.com';
    this.password = role === 'admin' ? 'admin123' : 'cliente123';
    this.error = '';
    this.submit();
  }

  toggleMode(): void {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.notice = '';
  }

  submit(): void {
    if (this.loading) {
      return;
    }
    this.error = '';
    this.notice = '';
    this.loading = true;
    if (this.isRegister) {
      this.auth.register({
        nombre: this.nombre.trim(),
        correo: this.correo.trim(),
        password: this.password,
      }).subscribe({
        next: () => {
          this.isRegister = false;
          this.notice = 'Cuenta creada. Iniciando sesión…';
          this.login();
        },
        error: (error: { error?: { message?: string } }) => {
          this.error = error.error?.message ?? 'No se pudo crear la cuenta. Inténtalo nuevamente.';
          this.loading = false;
        },
      });
      return;
    }
    this.login();
  }

  private login(): void {
    this.auth.login(this.correo.trim(), this.password).subscribe({
      next: (response) => {
        this.loading = false;
        void this.router.navigate([this.auth.homeFor(response.usuario)]);
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo nuevamente.';
        this.loading = false;
      },
    });
  }
}

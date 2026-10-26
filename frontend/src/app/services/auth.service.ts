import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models';

const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'ecommerce_token';
const USER_KEY = 'ecommerce_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(correo: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { correo, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(datos: {
    nombre: string;
    correo: string;
    password: string;
    rol?: User['rol'];
  }): Observable<{ usuario: User }> {
    return this.http.post<{ usuario: User }>(`${API_URL}/auth/register`, datos);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }
    try {
      const user: unknown = JSON.parse(rawUser);
      if (
        typeof user === 'object' &&
        user !== null &&
        'id_usuario' in user &&
        'nombre' in user &&
        'correo' in user &&
        'rol' in user &&
        (user.rol === 'admin' || user.rol === 'cliente')
      ) {
        return user as User;
      }
    } catch (error) {
      console.error('No se pudieron leer los datos de sesión almacenados.', error);
    }
    this.logout();
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  homeFor(user: User | null = this.getUser()): string {
    return user?.rol === 'admin' ? '/admin' : '/tienda';
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
  }
}

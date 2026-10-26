import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  obtenerResumen(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      'http://localhost:3000/api/dashboard/resumen',
    );
  }
}

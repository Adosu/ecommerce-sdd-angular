import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Invoice } from '../models';

const API_URL = 'http://localhost:3000/api/facturas';

@Injectable({ providedIn: 'root' })
export class FacturasService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Invoice[]> {
    return this.http
      .get<{ facturas: Invoice[] }>(API_URL)
      .pipe(map((response) => response.facturas));
  }

  crear(items: Array<{ id_producto: number; cantidad: number }>): Observable<Invoice> {
    return this.http
      .post<{ factura: Invoice }>(API_URL, { items })
      .pipe(map((response) => response.factura));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product, ProductPayload } from '../models';

const API_URL = 'http://localhost:3000/api/productos';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Product[]> {
    return this.http
      .get<{ productos: Product[] }>(API_URL)
      .pipe(map((response) => response.productos));
  }

  crear(producto: ProductPayload): Observable<Product> {
    return this.http
      .post<{ producto: Product }>(API_URL, producto)
      .pipe(map((response) => response.producto));
  }

  actualizar(id: number, producto: ProductPayload): Observable<Product> {
    return this.http
      .put<{ producto: Product }>(`${API_URL}/${id}`, producto)
      .pipe(map((response) => response.producto));
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/${id}`);
  }
}

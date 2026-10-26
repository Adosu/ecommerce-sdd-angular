export type UserRole = 'admin' | 'cliente';

export interface User {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: UserRole;
}

export interface AuthResponse {
  token: string;
  usuario: User;
}

export interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
}

export interface ProductPayload {
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
}

export interface InvoiceDetail {
  id_detalle: number;
  id_producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
}

export interface Invoice {
  id_factura: number;
  id_usuario: number;
  fecha_emision: string;
  subtotal: number;
  iva: number;
  total: number;
  cliente_nombre?: string;
  cliente_correo?: string;
  detalles: InvoiceDetail[];
}

export interface DashboardSummary {
  totalIngresos: number;
  totalVentas: number;
  productosBajoStock: number;
  productosMasVendidos: Array<{
    id_producto: number;
    nombre: string;
    cantidadVendida: number;
  }>;
}

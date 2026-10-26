import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardSummary, Invoice, Product, ProductPayload, User } from '../models';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { FacturasService } from '../services/facturas.service';
import { ProductosService } from '../services/productos.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="app-shell admin-shell">
      <aside class="sidebar">
        <a class="brand brand-light" href="/admin"><span class="brand-mark">N</span> norte<span>.</span></a>
        <div class="sidebar-label">GESTIÓN</div>
        <a class="side-link selected" href="#dashboard"><span>▦</span> Panel de ventas</a>
        <a class="side-link" href="#productos"><span>◇</span> Productos</a>
        <a class="side-link" href="#facturas"><span>▤</span> Facturas</a>
        <div class="sidebar-bottom">
          <div class="admin-profile"><span class="user-avatar admin-profile-avatar">{{ initials }}</span><div><strong>{{ user?.nombre }}</strong><small>Administrador</small></div></div>
          <button class="side-logout" (click)="logout()">↪ <span>Cerrar sesión</span></button>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar"><div><span class="breadcrumb">Norte <span>/</span> Administración</span><h1>Panel de control</h1></div><div class="topbar-right"><span class="live-status"><i></i> Sistema activo</span><span class="user-avatar">{{ initials }}</span></div></header>
        <div class="admin-content">
          @if (error) { <div class="alert error-alert">{{ error }}</div> }
          @if (success) { <div class="alert success-alert">{{ success }}</div> }

          <section id="dashboard" class="dashboard-section">
            <div class="section-heading admin-section-heading"><div><p class="eyebrow">RESUMEN GENERAL</p><h2>Tu negocio, de un vistazo</h2></div><button class="button button-quiet" (click)="refreshDashboard()">↻ Actualizar</button></div>
            @if (loadingDashboard) { <div class="loading-state">Cargando indicadores…</div> }
            @else if (summary) {
              <div class="metric-grid">
                <article class="metric-card"><div class="metric-top"><span class="metric-icon revenue-icon">$</span><span class="metric-tag">ACUMULADO</span></div><p>Ingresos totales</p><strong>{{ summary.totalIngresos | currency:'USD':'symbol':'1.2-2' }}</strong><small>Ingresos registrados en facturas</small></article>
                <article class="metric-card"><div class="metric-top"><span class="metric-icon sales-icon">↗</span><span class="metric-tag">HISTÓRICO</span></div><p>Ventas realizadas</p><strong>{{ summary.totalVentas }}</strong><small>Facturas emitidas</small></article>
                <article class="metric-card"><div class="metric-top"><span class="metric-icon stock-icon">!</span><span class="metric-tag">ATENCIÓN</span></div><p>Productos con bajo stock</p><strong>{{ summary.productosBajoStock }}</strong><small>Productos con 5 unidades o menos</small></article>
              </div>
              <article class="top-products-card">
                <div class="table-heading"><div><p class="eyebrow">RENDIMIENTO</p><h3>Productos más vendidos</h3></div><span class="tag-light">TOP 5</span></div>
                @if (summary.productosMasVendidos.length === 0) { <div class="table-empty">Aún no hay ventas para mostrar.</div> }
                @else {
                  <div class="top-list">
                    @for (product of summary.productosMasVendidos; track product.id_producto; let index = $index) {
                      <div class="top-row"><span class="rank">{{ (index + 1).toString().padStart(2, '0') }}</span><span class="top-monogram">{{ product.nombre.charAt(0).toUpperCase() }}</span><strong>{{ product.nombre }}</strong><span class="top-quantity">{{ product.cantidadVendida }} unidades</span><div class="top-bar"><span [style.width.%]="topBarWidth(product.cantidadVendida)"></span></div></div>
                    }
                  </div>
                }
              </article>
            }
          </section>

          <section id="productos" class="admin-products-section">
            <div class="section-heading admin-section-heading"><div><p class="eyebrow">INVENTARIO</p><h2>Gestión de productos</h2></div><button class="button button-primary" type="button" (click)="startCreate()">＋ Nuevo producto</button></div>
            @if (editing) {
              <form class="product-form" (ngSubmit)="saveProduct()" #productForm="ngForm">
                <div class="form-heading"><div><p class="eyebrow">{{ editingId ? 'ACTUALIZACIÓN' : 'NUEVO REGISTRO' }}</p><h3>{{ editingId ? 'Editar producto' : 'Agregar producto' }}</h3></div><button class="icon-button" type="button" aria-label="Cerrar formulario" (click)="cancelEdit()">×</button></div>
                <div class="form-grid">
                  <label>Nombre<input name="nombre" [(ngModel)]="form.nombre" required></label>
                  <label>Precio (USD)<input name="precio" type="number" min="0" step="0.01" [(ngModel)]="form.precio" required></label>
                  <label>Stock<input name="stock" type="number" min="0" step="1" [(ngModel)]="form.stock" required></label>
                  <label>URL de imagen<input name="imagen_url" type="url" [(ngModel)]="form.imagen_url" placeholder="https://…"></label>
                  <label class="form-span">Descripción<textarea name="descripcion" rows="2" [(ngModel)]="form.descripcion"></textarea></label>
                </div>
                <div class="form-actions"><button class="button button-quiet" type="button" (click)="cancelEdit()">Cancelar</button><button class="button button-primary" type="submit" [disabled]="saving || productForm.invalid">{{ saving ? 'Guardando…' : (editingId ? 'Guardar cambios' : 'Crear producto') }}</button></div>
              </form>
            }
            <div class="table-card">
              <div class="table-heading"><div><h3>Todos los productos</h3><p>{{ products.length }} productos activos en el catálogo</p></div></div>
              @if (loadingProducts) { <div class="loading-state">Cargando productos…</div> }
              @else if (products.length === 0) { <div class="table-empty">No hay productos activos. Agrega el primero para comenzar.</div> }
              @else {
                <div class="table-scroll"><table><thead><tr><th>PRODUCTO</th><th>PRECIO</th><th>STOCK</th><th>ESTADO</th><th class="actions-heading">ACCIONES</th></tr></thead>
                  <tbody>@for (product of products; track product.id_producto) {
                    <tr><td><div class="product-cell"><span class="table-monogram">{{ product.nombre.charAt(0).toUpperCase() }}</span><div><strong>{{ product.nombre }}</strong><small>{{ product.descripcion || 'Sin descripción' }}</small></div></div></td><td class="price-cell">{{ product.precio | currency:'USD':'symbol':'1.2-2' }}</td><td>{{ product.stock }}</td><td><span class="status-pill" [class.status-low]="product.stock <= 5">{{ product.stock <= 5 ? 'Stock bajo' : 'Disponible' }}</span></td><td><div class="row-actions"><button class="edit-action" (click)="startEdit(product)">Editar</button><button class="delete-action" (click)="deleteProduct(product)">Eliminar</button></div></td></tr>
                  }</tbody></table></div>
              }
            </div>
          </section>

          <section id="facturas" class="admin-invoices-section">
            <div class="section-heading admin-section-heading"><div><p class="eyebrow">TRANSACCIONES</p><h2>Facturas emitidas</h2></div><button class="button button-quiet" (click)="loadInvoices()">↻ Actualizar</button></div>
            <div class="table-card">
              @if (loadingInvoices) { <div class="loading-state">Cargando facturas…</div> }
              @else if (invoices.length === 0) { <div class="table-empty">Todavía no se han emitido facturas.</div> }
              @else {
                <div class="table-scroll"><table><thead><tr><th>FACTURA</th><th>CLIENTE</th><th>FECHA</th><th>SUBTOTAL</th><th>IVA</th><th>TOTAL</th></tr></thead>
                  <tbody>@for (invoice of invoices; track invoice.id_factura) {
                    <tr><td><span class="invoice-number">#{{ invoice.id_factura }}</span><small class="invoice-items-cell">{{ invoice.detalles.length }} artículos</small></td><td><div class="customer-cell"><strong>{{ invoice.cliente_nombre || 'Cliente' }}</strong><small>{{ invoice.cliente_correo || 'Usuario #' + invoice.id_usuario }}</small></div></td><td>{{ invoice.fecha_emision | date:'mediumDate' }}</td><td>{{ invoice.subtotal | currency:'USD':'symbol':'1.2-2' }}</td><td>{{ invoice.iva | currency:'USD':'symbol':'1.2-2' }}</td><td class="price-cell">{{ invoice.total | currency:'USD':'symbol':'1.2-2' }}</td></tr>
                  }</tbody></table></div>
              }
            </div>
          </section>
          <footer class="admin-footer">Norte Commerce <span>·</span> Panel de administración</footer>
        </div>
      </main>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  user: User | null = null;
  summary: DashboardSummary | null = null;
  products: Product[] = [];
  invoices: Invoice[] = [];
  loadingDashboard = true;
  loadingProducts = true;
  loadingInvoices = true;
  editing = false;
  editingId: number | null = null;
  saving = false;
  error = '';
  success = '';
  form: ProductPayload = this.emptyForm();

  constructor(
    private readonly auth: AuthService,
    private readonly dashboardService: DashboardService,
    private readonly productsService: ProductosService,
    private readonly invoicesService: FacturasService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    this.refreshDashboard();
    this.loadProducts();
    this.loadInvoices();
  }

  get initials(): string {
    return this.user?.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'AD';
  }

  topBarWidth(quantity: number): number {
    const maximum = Math.max(...(this.summary?.productosMasVendidos.map((product) => product.cantidadVendida) ?? [1]), 1);
    return Math.max(8, (quantity / maximum) * 100);
  }

  refreshDashboard(): void {
    this.loadingDashboard = true;
    this.dashboardService.obtenerResumen().subscribe({
      next: (summary) => { this.summary = summary; this.loadingDashboard = false; },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo cargar el resumen de ventas.';
        this.loadingDashboard = false;
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productsService.listar().subscribe({
      next: (products) => { this.products = products; this.loadingProducts = false; },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudieron cargar los productos.';
        this.loadingProducts = false;
      },
    });
  }

  loadInvoices(): void {
    this.loadingInvoices = true;
    this.invoicesService.listar().subscribe({
      next: (invoices) => { this.invoices = invoices; this.loadingInvoices = false; },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudieron cargar las facturas.';
        this.loadingInvoices = false;
      },
    });
  }

  startCreate(): void {
    this.error = '';
    this.success = '';
    this.editingId = null;
    this.form = this.emptyForm();
    this.editing = true;
  }

  startEdit(product: Product): void {
    this.error = '';
    this.success = '';
    this.editingId = product.id_producto;
    this.form = {
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      imagen_url: product.imagen_url,
    };
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editingId = null;
  }

  saveProduct(): void {
    if (this.saving) {
      return;
    }
    this.error = '';
    this.success = '';
    this.saving = true;
    const payload: ProductPayload = {
      ...this.form,
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion?.trim() || null,
      imagen_url: this.form.imagen_url?.trim() || null,
      precio: Number(this.form.precio),
      stock: Number(this.form.stock),
    };
    const request = this.editingId
      ? this.productsService.actualizar(this.editingId, payload)
      : this.productsService.crear(payload);
    request.subscribe({
      next: () => {
        this.success = this.editingId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.';
        this.saving = false;
        this.cancelEdit();
        this.loadProducts();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo guardar el producto.';
        this.saving = false;
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!window.confirm(`¿Dar de baja "${product.nombre}"?`)) {
      return;
    }
    this.error = '';
    this.success = '';
    this.productsService.eliminar(product.id_producto).subscribe({
      next: () => {
        this.success = 'Producto dado de baja correctamente.';
        this.loadProducts();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo eliminar el producto.';
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  private emptyForm(): ProductPayload {
    return { nombre: '', descripcion: null, precio: 0, stock: 0, imagen_url: null };
  }
}

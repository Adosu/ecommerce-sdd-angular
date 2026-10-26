import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Invoice, Product, User } from '../models';
import { AuthService } from '../services/auth.service';
import { FacturasService } from '../services/facturas.service';
import { ProductosService } from '../services/productos.service';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand brand-dark" href="/tienda"><span class="brand-mark">N</span> norte<span>.</span></a>
        <nav class="top-nav"><a class="nav-link active" href="#catalogo">Catálogo</a><a class="nav-link" href="#historial">Mis compras</a></nav>
        <div class="user-menu"><span class="user-avatar">{{ initials }}</span><span class="user-name">{{ user?.nombre }}</span><button class="button button-quiet" (click)="logout()">Salir</button></div>
      </header>

      <main class="page-content">
        <section class="welcome-banner">
          <div><p class="eyebrow">TU TIENDA DE CONFIANZA</p><h1>Hola, {{ firstName }} <span class="wave">✦</span></h1><p>Encuentra eso que hace mejor tu día.</p></div>
          <div class="banner-art"><div class="art-circle"></div><span class="art-sparkle">✳</span><span class="art-box">N</span></div>
        </section>

        <div class="section-heading" id="catalogo"><div><p class="eyebrow">SELECCIÓN NORTE</p><h2>Explora el catálogo</h2></div><span class="result-count">{{ products.length }} productos disponibles</span></div>
        @if (error) { <div class="alert error-alert">{{ error }}</div> }
        @if (success) { <div class="alert success-alert">{{ success }}</div> }
        @if (loadingProducts) { <div class="loading-state">Cargando productos…</div> }
        @else if (products.length === 0) { <div class="empty-state"><span>◌</span><h3>Pronto habrá novedades</h3><p>No hay productos disponibles en este momento.</p></div> }
        @else {
          <section class="product-grid">
            @for (product of products; track product.id_producto) {
              <article class="product-card">
                <div class="product-visual" [class.has-image]="product.imagen_url">
                  @if (product.imagen_url) { <img [src]="product.imagen_url" [alt]="product.nombre"> }
                  @else { <span class="product-monogram">{{ product.nombre.charAt(0).toUpperCase() }}</span> }
                  <span class="stock-pill" [class.low-stock]="product.stock <= 5">{{ product.stock }} en stock</span>
                </div>
                <div class="product-info">
                  <h3>{{ product.nombre }}</h3>
                  <p class="product-description">{{ product.descripcion || 'Una excelente elección para ti.' }}</p>
                  <div class="product-buy"><strong>{{ product.precio | currency:'USD':'symbol':'1.2-2' }}</strong>
                    <button class="button button-add" (click)="addToCart(product)" [disabled]="product.stock <= quantityOf(product.id_producto)">
                      {{ quantityOf(product.id_producto) ? 'Añadir más +' : 'Añadir +' }}
                    </button>
                  </div>
                </div>
              </article>
            }
          </section>
        }

        <section class="cart-panel">
          <div class="cart-heading"><div><p class="eyebrow">TU SELECCIÓN</p><h2>Carrito <span class="cart-count">{{ cartCount }}</span></h2></div><button class="text-button" type="button" (click)="clearCart()" [disabled]="cartCount === 0">Vaciar carrito</button></div>
          @if (cartItems.length === 0) { <p class="muted cart-empty">Todavía no has agregado productos. Explora el catálogo para comenzar.</p> }
          @else {
            <div class="cart-lines">
              @for (item of cartItems; track item.product.id_producto) {
                <div class="cart-line">
                  <span class="line-monogram">{{ item.product.nombre.charAt(0).toUpperCase() }}</span>
                  <div class="line-title"><strong>{{ item.product.nombre }}</strong><small>{{ item.product.precio | currency:'USD':'symbol':'1.2-2' }} c/u</small></div>
                  <div class="quantity-control"><button aria-label="Quitar una unidad" (click)="changeQuantity(item.product, -1)">−</button><span>{{ item.quantity }}</span><button aria-label="Añadir una unidad" (click)="changeQuantity(item.product, 1)" [disabled]="item.quantity >= item.product.stock">+</button></div>
                  <strong class="line-total">{{ item.product.precio * item.quantity | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
              }
            </div>
            <div class="cart-summary">
              <div><span>Subtotal</span><strong>{{ subtotal | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div><span>IVA (15%)</span><strong>{{ iva | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-total"><span>Total a pagar</span><strong>{{ total | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <button class="button button-primary checkout-button" (click)="checkout()" [disabled]="checkingOut">
                {{ checkingOut ? 'Generando factura…' : 'Generar factura / Comprar' }} <span>→</span>
              </button>
            </div>
          }
        </section>

        <section class="history-section" id="historial">
          <div class="section-heading"><div><p class="eyebrow">TUS PEDIDOS</p><h2>Historial de compras</h2></div><button class="button button-quiet" (click)="loadInvoices()">Actualizar</button></div>
          @if (invoices.length === 0) { <div class="empty-history">Aún no tienes facturas. Tus compras aparecerán aquí.</div> }
          @else {
            <div class="invoice-list">
              @for (invoice of invoices; track invoice.id_factura) {
                <article class="invoice-card">
                  <div class="invoice-top"><div><span class="invoice-number">Factura #{{ invoice.id_factura }}</span><span class="invoice-date">{{ invoice.fecha_emision | date:'mediumDate' }}</span></div><strong>{{ invoice.total | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                  <div class="invoice-items">@for (detail of invoice.detalles; track detail.id_detalle) { <span>{{ detail.cantidad }} × {{ detail.producto_nombre }}</span> }</div>
                  <div class="invoice-breakdown"><span>Subtotal {{ invoice.subtotal | currency:'USD':'symbol':'1.2-2' }}</span><span>IVA {{ invoice.iva | currency:'USD':'symbol':'1.2-2' }}</span></div>
                </article>
              }
            </div>
          }
        </section>
      </main>
      <footer class="app-footer">Norte Commerce <span>·</span> Compra con confianza.</footer>
    </div>
  `,
})
export class TiendaComponent implements OnInit {
  user: User | null = null;
  products: Product[] = [];
  invoices: Invoice[] = [];
  quantities = new Map<number, number>();
  loadingProducts = true;
  checkingOut = false;
  error = '';
  success = '';

  constructor(
    private readonly auth: AuthService,
    private readonly productsService: ProductosService,
    private readonly invoicesService: FacturasService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    this.loadProducts();
    this.loadInvoices();
  }

  get firstName(): string {
    return this.user?.nombre.split(' ')[0] ?? 'bienvenido';
  }

  get initials(): string {
    return this.user?.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'U';
  }

  get cartItems(): Array<{ product: Product; quantity: number }> {
    return [...this.quantities.entries()]
      .map(([id, quantity]) => ({ product: this.products.find((product) => product.id_producto === id), quantity }))
      .filter((item): item is { product: Product; quantity: number } => !!item.product);
  }

  get cartCount(): number {
    return [...this.quantities.values()].reduce((sum, quantity) => sum + quantity, 0);
  }

  get subtotal(): number {
    return this.subtotalCents / 100;
  }

  get iva(): number {
    return Math.floor((this.subtotalCents * 15 + 50) / 100) / 100;
  }

  get total(): number {
    return this.subtotal + this.iva;
  }

  quantityOf(id: number): number {
    return this.quantities.get(id) ?? 0;
  }

  addToCart(product: Product): void {
    this.changeQuantity(product, 1);
    this.success = '';
  }

  changeQuantity(product: Product, change: number): void {
    const next = this.quantityOf(product.id_producto) + change;
    if (next <= 0) {
      this.quantities.delete(product.id_producto);
      return;
    }
    if (next <= product.stock) {
      this.quantities.set(product.id_producto, next);
    }
  }

  clearCart(): void {
    this.quantities.clear();
  }

  checkout(): void {
    if (!this.cartItems.length || this.checkingOut) {
      return;
    }
    this.error = '';
    this.success = '';
    this.checkingOut = true;
    const items = this.cartItems.map(({ product, quantity }) => ({
      id_producto: product.id_producto,
      cantidad: quantity,
    }));
    this.invoicesService.crear(items).subscribe({
      next: (invoice) => {
        this.quantities.clear();
        this.checkingOut = false;
        this.success = `¡Compra realizada! Tu factura #${invoice.id_factura} está lista.`;
        this.loadProducts();
        this.loadInvoices();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo generar la factura. Inténtalo nuevamente.';
        this.checkingOut = false;
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productsService.listar().subscribe({
      next: (products) => {
        this.products = products;
        this.loadingProducts = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo cargar el catálogo.';
        this.loadingProducts = false;
      },
    });
  }

  loadInvoices(): void {
    this.invoicesService.listar().subscribe({
      next: (invoices) => { this.invoices = invoices; },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudo cargar el historial de facturas.';
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  private get subtotalCents(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + Math.round(item.product.precio * 100) * item.quantity,
      0,
    );
  }
}

ESPECIFICACIÓN TÉCNICA DEL SISTEMA: E-COMMERCE CON FACTURACIÓN Y PANEL ADMINISTRATIVO

1. Descripción General del Sistema
Sistema web de comercio electrónico desarrollado bajo el enfoque Spec Driven Development (SDD) que permite la gestión de inventario, venta de productos mediante carrito de compras, generación de facturas y visualización de métricas comerciales diferenciadas por roles de usuario.

2. Stack Tecnológico
- Frontend: Angular (Arquitectura modular basada en componentes, servicios e interceptores HTTP).
- Backend: Node.js con el framework Express (API RESTful).Base de Datos: PostgreSQL administrada mediante pgAdmin 4.
- Autenticación y Seguridad: JSON Web Tokens (JWT) y encriptación de contraseñas con bcrypt.

3. Arquitectura del Backend (Estándar contra "Código Espagueti")Para garantizar la mantenibilidad y escalabilidad del servidor en Node.js + Express, queda prohibido colocar consultas SQL o lógica de negocio directamente en el archivo de rutas. El backend debe seguir obligatoriamente una Arquitectura en Capas:
backend/
├── src/
│   ├── config/         # Conexión a PostgreSQL (Pool de pg) y variables de entorno
│   ├── routes/         # Definición de endpoints (ej. auth.routes.js, productos.routes.js)
│   ├── controllers/    # Reciben la petición HTTP (req, res) y llaman al servicio
│   ├── services/       # Lógica de negocio pura (cálculo de totales, validación de stock)
│   ├── middlewares/    # Verificación de JWT y validación de rol (Admin vs Cliente)
│   └── app.js          # Configuración global de Express y CORS
├── tests/              # Pruebas automatizadas para el pipeline de GitHub Actions
└── package.json

4. Diseño de la Base de Datos Relacional (PostgreSQL)
El esquema en PostgreSQL consta de 4 tablas principales:
- usuarios: id_usuario (PK, Serial), nombre (VARCHAR), correo (VARCHAR, UNIQUE), password_hash (VARCHAR), rol (VARCHAR: 'admin' o 'cliente'), fecha_registro (TIMESTAMP).
- productos: id_producto (PK, Serial), nombre (VARCHAR), descripcion (TEXT), precio (NUMERIC(10,2)), stock (INT), imagen_url (TEXT), activo (BOOLEAN).
- facturas: id_factura (PK, Serial), id_usuario (FK -> usuarios), fecha_emision (TIMESTAMP), subtotal (NUMERIC(10,2)), iva (NUMERIC(10,2)), total (NUMERIC(10,2)).
- detalle_factura: id_detalle (PK, Serial), id_factura (FK -> facturas), id_producto (FK -> productos), cantidad (INT), precio_unitario (NUMERIC(10,2)), subtotal_linea (NUMERIC(10,2)).

5. Requerimientos Funcionales y Contratos de API (Endpoints)
- Módulo 1: Autenticación (POST /api/auth/login y POST /api/auth/register) Criterio de aceptación: Valida credenciales contra PostgreSQL y devuelve un token JWT que incluye el id_usuario y su rol (admin o cliente). En Angular, un Guard redirige al usuario a su vista correspondiente según el rol.
- Módulo 2: Gestión de Productos - Rol Admin (GET, POST, PUT, DELETE en /api/productos) Criterio de aceptación: Los usuarios clientes solo pueden ejecutar GET /api/productos (ver catálogo con stock disponible). Solo el rol admin puede crear, editar o dar de baja productos.
- Módulo 3: Carrito y Facturación - Rol Cliente (POST /api/facturas) Criterio de aceptación: El cliente agrega productos al carrito en Angular. Al confirmar la compra, el backend inicia una transacción SQL en PostgreSQL: verifica que haya stock suficiente, inserta la cabecera en facturas, registra los ítems en detalle_factura y descuenta automáticamente el stock en la tabla productos.
- Módulo 4: Panel de Ventas y Facturas - Rol Admin (GET /api/facturas y GET /api/dashboard/resumen) Criterio de aceptación: El administrador visualiza todas las facturas emitidas y un panel con indicadores clave: total de ingresos recaudados, número de ventas realizadas, cantidad de productos con bajo stock y listado de productos más vendidos.
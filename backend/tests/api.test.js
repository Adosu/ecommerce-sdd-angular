jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('API E-commerce', () => {
  const jwtSecret = 'test-secret-for-api-tests';

  beforeAll(() => {
    process.env.JWT_SECRET = jwtSecret;
  });

  beforeEach(() => {
    pool.query.mockReset();
    pool.connect.mockReset();
    bcrypt.compare.mockReset();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  test('GET /api/health responde 200 y confirma que la API funciona', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('POST /api/auth/login autentica y devuelve un JWT válido', async () => {
    pool.query.mockResolvedValue({
      rows: [{
        id_usuario: 7,
        nombre: 'Cliente',
        correo: 'cliente@example.com',
        password_hash: 'hashed-password',
        rol: 'cliente',
      }],
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'CLIENTE@example.com', password: 'password-segura' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(jwt.verify(response.body.token, jwtSecret)).toMatchObject({
      id_usuario: 7,
      correo: 'cliente@example.com',
      rol: 'cliente',
    });
    expect(response.body.usuario).toMatchObject({ id_usuario: 7, rol: 'cliente' });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password-segura',
      'hashed-password',
    );
  });

  test('GET /api/productos devuelve los productos activos del servicio', async () => {
    const productos = [{
      id_producto: 1,
      nombre: 'Teclado',
      descripcion: 'Teclado mecánico',
      precio: '49.99',
      stock: 12,
      imagen_url: null,
      activo: true,
    }];
    pool.query.mockResolvedValue({ rows: productos });

    const response = await request(app).get('/api/productos');

    expect(response.status).toBe(200);
    expect(response.body.productos).toEqual(productos);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE activo = TRUE'),
    );
  });

  test('POST /api/productos sin token rechaza la petición', async () => {
    const response = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto', precio: 10, stock: 2 });

    expect([401, 403]).toContain(response.status);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('GET /api/dashboard/resumen calcula y devuelve el resumen de ventas', async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes('SUM(total)')) {
        return Promise.resolve({
          rows: [{ totalIngresos: '149.98', totalVentas: '3' }],
        });
      }
      if (sql.includes('stock <= 5')) {
        return Promise.resolve({ rows: [{ cantidad: '2' }] });
      }
      if (sql.includes('SUM(d.cantidad)')) {
        return Promise.resolve({
          rows: [{ id_producto: 1, nombre: 'Teclado', cantidadVendida: '4' }],
        });
      }
      return Promise.reject(new Error('Consulta SQL inesperada'));
    });
    const token = jwt.sign(
      { id_usuario: 1, rol: 'admin' },
      jwtSecret,
    );

    const response = await request(app)
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalIngresos: 149.98,
      totalVentas: 3,
      productosBajoStock: 2,
      productosMasVendidos: [
        { id_producto: 1, nombre: 'Teclado', cantidadVendida: 4 },
      ],
    });
    expect(pool.query).toHaveBeenCalledTimes(3);
  });
});

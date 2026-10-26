const pool = require('../config/db');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function validarProducto(producto) {
  if (!producto || typeof producto !== 'object' || Array.isArray(producto)) {
    throw new ServiceError('Datos de producto invalidos', 400);
  }
  const { nombre, precio, stock, descripcion, imagen_url } = producto;
  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    precio === undefined ||
    precio === null ||
    (typeof precio !== 'number' && typeof precio !== 'string') ||
    (typeof precio === 'string' && !precio.trim()) ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    Number(precio) > 99999999.99 ||
    stock === undefined ||
    stock === null ||
    (typeof stock !== 'number' && typeof stock !== 'string') ||
    (typeof stock === 'string' && !stock.trim()) ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0 ||
    Number(stock) > 2147483647 ||
    (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') ||
    (imagen_url !== undefined && imagen_url !== null && typeof imagen_url !== 'string')
  ) {
    throw new ServiceError('Datos de producto invalidos', 400);
  }
}

function validarId(id) {
  if (!/^[1-9]\d*$/.test(String(id)) || Number(id) > 2147483647) {
    throw new ServiceError('Identificador de producto invalido', 400);
  }
  return Number(id);
}

async function listar() {
  const result = await pool.query(
    `SELECT id_producto, nombre, descripcion, precio, stock, imagen_url, activo
     FROM productos
     WHERE activo = TRUE
     ORDER BY id_producto`
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const idValidado = validarId(id);
  const result = await pool.query(
    `SELECT id_producto, nombre, descripcion, precio, stock, imagen_url, activo
     FROM productos
     WHERE id_producto = $1 AND activo = TRUE`,
    [idValidado]
  );
  if (!result.rows[0]) {
    throw new ServiceError('Producto no encontrado', 404);
  }
  return result.rows[0];
}

async function crear(producto = {}) {
  validarProducto(producto);
  const { nombre, descripcion = null, precio, stock, imagen_url = null } = producto;
  const result = await pool.query(
    `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_producto, nombre, descripcion, precio, stock, imagen_url, activo`,
    [nombre.trim(), descripcion, Number(precio), Number(stock), imagen_url]
  );
  return result.rows[0];
}

async function actualizar(id, producto = {}) {
  const idValidado = validarId(id);
  validarProducto(producto);
  const { nombre, descripcion = null, precio, stock, imagen_url = null } = producto;
  const result = await pool.query(
    `UPDATE productos
     SET nombre = $1, descripcion = $2, precio = $3, stock = $4, imagen_url = $5
     WHERE id_producto = $6 AND activo = TRUE
     RETURNING id_producto, nombre, descripcion, precio, stock, imagen_url, activo`,
    [nombre.trim(), descripcion, Number(precio), Number(stock), imagen_url, idValidado]
  );
  if (!result.rows[0]) {
    throw new ServiceError('Producto no encontrado', 404);
  }
  return result.rows[0];
}

async function desactivar(id) {
  const idValidado = validarId(id);
  const result = await pool.query(
    `UPDATE productos
     SET activo = FALSE
     WHERE id_producto = $1 AND activo = TRUE
     RETURNING id_producto`,
    [idValidado]
  );
  if (!result.rows[0]) {
    throw new ServiceError('Producto no encontrado', 404);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, desactivar, ServiceError };

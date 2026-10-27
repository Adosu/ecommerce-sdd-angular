const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function normalizarCorreo(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : '';
}

async function register(datos = {}) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ServiceError('Datos de registro invalidos', 400);
  }
  const { nombre, correo, password, rol = 'cliente' } = datos;
  const correoNormalizado = normalizarCorreo(correo);
  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !correoNormalizado ||
    typeof password !== 'string' ||
    !password ||
    !['admin', 'cliente'].includes(rol)
  ) {
    throw new ServiceError('Datos de registro invalidos', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, correo, rol`,
      [nombre.trim(), correoNormalizado, passwordHash, rol]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('El correo ya esta registrado', 400);
    }
    throw error;
  }
}

async function login(datos = {}) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ServiceError('Correo y contrasena son requeridos', 400);
  }
  const { correo, password } = datos;
  const correoNormalizado = normalizarCorreo(correo);
  if (!correoNormalizado || typeof password !== 'string' || !password) {
    throw new ServiceError('Correo y contrasena son requeridos', 400);
  }

  const result = await pool.query(
    `SELECT id_usuario, nombre, correo, password_hash, rol
     FROM usuarios
     WHERE correo = $1`,
    [correoNormalizado]
  );
  const usuario = result.rows[0];
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw new ServiceError('Credenciales invalidas', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ServiceError('JWT_SECRET no esta configurado', 500);
  }

  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };

  return { token: jwt.sign(payload, secret, { expiresIn: '1h' }), usuario: payload };
}

async function inicializarUsuariosPrueba() {
  const usuarios = [
    { nombre: 'Administrador', correo: 'admin@ecommerce.com', password: 'admin123', rol: 'admin' },
    { nombre: 'Cliente de prueba', correo: 'cliente@ecommerce.com', password: 'cliente123', rol: 'cliente' },
  ];

  for (const usuario of usuarios) {
    const passwordHash = await bcrypt.hash(usuario.password, SALT_ROUNDS);
    await pool.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (correo) DO NOTHING`,
      [usuario.nombre, usuario.correo, passwordHash, usuario.rol]
    );
  }
}

module.exports = { register, login, inicializarUsuariosPrueba, ServiceError };

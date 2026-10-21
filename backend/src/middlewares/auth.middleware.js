require('dotenv').config();

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token de autenticacion requerido' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET no esta configurado' });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.id_usuario === undefined ||
      typeof payload.rol !== 'string'
    ) {
      return res.status(401).json({ message: 'Token de autenticacion invalido' });
    }

    req.usuario = {
      id_usuario: payload.id_usuario,
      rol: payload.rol,
    };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token de autenticacion invalido o expirado' });
    }
    return next(error);
  }
}

function verificarAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ message: 'Autenticacion requerida' });
  }

  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso restringido a administradores' });
  }

  return next();
}

module.exports = { verificarToken, verificarAdmin };

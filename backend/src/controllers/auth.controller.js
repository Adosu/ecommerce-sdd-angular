const authService = require('../services/auth.service');

function responderError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500) {
    console.error('Error en autenticacion:', error);
  }
  return res.status(statusCode).json({ message: statusCode === 500 ? 'Error interno del servidor' : error.message });
}

async function register(req, res) {
  try {
    const usuario = await authService.register(req.body);
    return res.status(201).json({ usuario });
  } catch (error) {
    return responderError(res, error);
  }
}

async function login(req, res) {
  try {
    const resultado = await authService.login(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
}

module.exports = { register, login };

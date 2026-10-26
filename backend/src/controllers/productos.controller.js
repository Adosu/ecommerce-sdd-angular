const productosService = require('../services/productos.service');

function responderError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500) {
    console.error('Error en productos:', error);
  }
  return res.status(statusCode).json({ message: statusCode === 500 ? 'Error interno del servidor' : error.message });
}

async function listar(req, res) {
  try {
    return res.status(200).json({ productos: await productosService.listar() });
  } catch (error) {
    return responderError(res, error);
  }
}

async function obtenerPorId(req, res) {
  try {
    const producto = await productosService.obtenerPorId(req.params.id);
    return res.status(200).json({ producto });
  } catch (error) {
    return responderError(res, error);
  }
}

async function crear(req, res) {
  try {
    const producto = await productosService.crear(req.body);
    return res.status(201).json({ producto });
  } catch (error) {
    return responderError(res, error);
  }
}

async function actualizar(req, res) {
  try {
    const producto = await productosService.actualizar(req.params.id, req.body);
    return res.status(200).json({ producto });
  } catch (error) {
    return responderError(res, error);
  }
}

async function eliminar(req, res) {
  try {
    await productosService.desactivar(req.params.id);
    return res.status(200).json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    return responderError(res, error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };

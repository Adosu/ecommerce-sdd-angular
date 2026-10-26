const facturasService = require('../services/facturas.service');

function responderError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500) {
    console.error('Error en facturacion:', error);
  }
  return res.status(statusCode).json({
    message: statusCode === 500 ? 'Error interno del servidor' : error.message,
  });
}

async function crear(req, res) {
  try {
    const factura = await facturasService.crearFactura(
      req.usuario.id_usuario,
      req.body && req.body.items
    );
    return res.status(201).json({ factura });
  } catch (error) {
    return responderError(res, error);
  }
}

async function listar(req, res) {
  try {
    const facturas = await facturasService.obtenerFacturas(req.usuario);
    return res.status(200).json({ facturas });
  } catch (error) {
    return responderError(res, error);
  }
}

module.exports = { crear, listar };

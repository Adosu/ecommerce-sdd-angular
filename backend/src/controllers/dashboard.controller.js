const dashboardService = require('../services/dashboard.service');

async function obtenerResumen(req, res) {
  try {
    const resumen = await dashboardService.obtenerResumenVentas();
    return res.status(200).json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de ventas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { obtenerResumen };

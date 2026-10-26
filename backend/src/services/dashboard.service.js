const pool = require('../config/db');

async function obtenerResumenVentas() {
  const [ingresosYVentas, productosBajoStock, productosMasVendidos] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(total), 0) AS "totalIngresos",
         COUNT(*) AS "totalVentas"
       FROM facturas`
    ),
    pool.query(
      `SELECT COUNT(*) AS cantidad
       FROM productos
       WHERE stock <= 5`
    ),
    pool.query(
      `SELECT
         p.id_producto,
         p.nombre,
         SUM(d.cantidad) AS "cantidadVendida"
       FROM detalle_factura d
       JOIN productos p ON p.id_producto = d.id_producto
       GROUP BY p.id_producto, p.nombre
       ORDER BY SUM(d.cantidad) DESC, p.id_producto
       LIMIT 5`
    ),
  ]);

  return {
    totalIngresos: Number(ingresosYVentas.rows[0].totalIngresos),
    totalVentas: Number(ingresosYVentas.rows[0].totalVentas),
    productosBajoStock: Number(productosBajoStock.rows[0].cantidad),
    productosMasVendidos: productosMasVendidos.rows.map((producto) => ({
      ...producto,
      cantidadVendida: Number(producto.cantidadVendida),
    })),
  };
}

module.exports = { obtenerResumenVentas };

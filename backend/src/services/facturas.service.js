const pool = require('../config/db');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ServiceError('El carrito debe contener al menos un producto', 400);
  }

  const cantidades = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item !== 'object' ||
      !/^[1-9]\d*$/.test(String(item.id_producto)) ||
      Number(item.id_producto) > 2147483647 ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad <= 0
    ) {
      throw new ServiceError('Los productos o cantidades del carrito son invalidos', 400);
    }

    const idProducto = Number(item.id_producto);
    const cantidadTotal = (cantidades.get(idProducto) || 0) + item.cantidad;
    if (!Number.isSafeInteger(cantidadTotal) || cantidadTotal > 2147483647) {
      throw new ServiceError('La cantidad solicitada no es valida', 400);
    }
    cantidades.set(idProducto, cantidadTotal);
  }

  return [...cantidades.entries()]
    .map(([id_producto, cantidad]) => ({ id_producto, cantidad }))
    .sort((a, b) => a.id_producto - b.id_producto);
}

function convertirCentavos(valor) {
  const coincidencia = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(valor));
  if (!coincidencia) {
    throw new Error(`Precio de producto invalido en la base de datos: ${valor}`);
  }
  const decimales = (coincidencia[2] || '').padEnd(2, '0');
  return BigInt(coincidencia[1]) * 100n + BigInt(decimales || '0');
}

function formatoMoneda(centavos) {
  return `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;
}

function validarTotal(centavos) {
  if (centavos > 9999999999n) {
    throw new ServiceError('El total de la factura excede el limite permitido', 400);
  }
}

async function crearFactura(id_usuario, items) {
  if (!Number.isSafeInteger(Number(id_usuario)) || Number(id_usuario) <= 0) {
    throw new ServiceError('Usuario invalido', 400);
  }
  const lineasSolicitadas = validarItems(items);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lineas = [];
    let subtotalCentavos = 0n;

    for (const item of lineasSolicitadas) {
      const resultado = await client.query(
        `SELECT id_producto, nombre, precio, stock
         FROM productos
         WHERE id_producto = $1 AND activo = TRUE
         FOR UPDATE`,
        [item.id_producto]
      );
      const producto = resultado.rows[0];
      if (!producto) {
        throw new ServiceError(`Producto ${item.id_producto} no encontrado`, 404);
      }
      if (producto.stock < item.cantidad) {
        throw new ServiceError(`Stock insuficiente para el producto ${producto.nombre}`, 400);
      }

      const precioCentavos = convertirCentavos(producto.precio);
      const subtotalLineaCentavos = precioCentavos * BigInt(item.cantidad);
      validarTotal(subtotalCentavos + subtotalLineaCentavos);
      subtotalCentavos += subtotalLineaCentavos;
      lineas.push({
        ...item,
        nombre: producto.nombre,
        precioCentavos,
        subtotalLineaCentavos,
      });
    }

    const ivaCentavos = (subtotalCentavos * 15n + 50n) / 100n;
    const totalCentavos = subtotalCentavos + ivaCentavos;
    validarTotal(totalCentavos);

    const resultadoFactura = await client.query(
      `INSERT INTO facturas (id_usuario, subtotal, iva, total)
       VALUES ($1, $2, $3, $4)
       RETURNING id_factura, id_usuario, fecha_emision, subtotal, iva, total`,
      [
        Number(id_usuario),
        formatoMoneda(subtotalCentavos),
        formatoMoneda(ivaCentavos),
        formatoMoneda(totalCentavos),
      ]
    );
    const factura = resultadoFactura.rows[0];
    factura.detalles = [];

    for (const linea of lineas) {
      const resultadoDetalle = await client.query(
        `INSERT INTO detalle_factura
           (id_factura, id_producto, cantidad, precio_unitario, subtotal_linea)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_detalle, id_factura, id_producto, cantidad, precio_unitario, subtotal_linea`,
        [
          factura.id_factura,
          linea.id_producto,
          linea.cantidad,
          formatoMoneda(linea.precioCentavos),
          formatoMoneda(linea.subtotalLineaCentavos),
        ]
      );
      factura.detalles.push({
        ...resultadoDetalle.rows[0],
        producto_nombre: linea.nombre,
      });

      await client.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2`,
        [linea.cantidad, linea.id_producto]
      );
    }

    await client.query('COMMIT');
    return factura;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error al revertir la transaccion de factura:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function obtenerFacturas(usuario) {
  if (
    !usuario ||
    !Number.isSafeInteger(Number(usuario.id_usuario)) ||
    Number(usuario.id_usuario) <= 0 ||
    !['admin', 'cliente'].includes(usuario.rol)
  ) {
    throw new ServiceError('Usuario invalido', 400);
  }

  const parametros = usuario.rol === 'admin' ? [] : [Number(usuario.id_usuario)];
  const filtroUsuario = usuario.rol === 'admin' ? '' : 'WHERE f.id_usuario = $1';
  const resultado = await pool.query(
    `SELECT
       f.id_factura,
       f.id_usuario,
       f.fecha_emision,
       f.subtotal,
       f.iva,
       f.total,
       u.nombre AS cliente_nombre,
       u.correo AS cliente_correo,
       COALESCE(
         json_agg(
           json_build_object(
             'id_detalle', d.id_detalle,
             'id_producto', d.id_producto,
             'producto_nombre', p.nombre,
             'cantidad', d.cantidad,
             'precio_unitario', d.precio_unitario,
             'subtotal_linea', d.subtotal_linea
           )
           ORDER BY d.id_detalle
         ) FILTER (WHERE d.id_detalle IS NOT NULL),
         '[]'::json
       ) AS detalles
     FROM facturas f
     JOIN usuarios u ON u.id_usuario = f.id_usuario
     LEFT JOIN detalle_factura d ON d.id_factura = f.id_factura
     LEFT JOIN productos p ON p.id_producto = d.id_producto
     ${filtroUsuario}
     GROUP BY f.id_factura, u.id_usuario
     ORDER BY f.fecha_emision DESC, f.id_factura DESC`,
    parametros
  );
  return resultado.rows;
}

module.exports = { crearFactura, obtenerFacturas, ServiceError };

const express = require('express');
const productosController = require('../controllers/productos.controller');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', productosController.listar);
router.get('/:id', productosController.obtenerPorId);
router.post('/', verificarToken, verificarAdmin, productosController.crear);
router.put('/:id', verificarToken, verificarAdmin, productosController.actualizar);
router.delete('/:id', verificarToken, verificarAdmin, productosController.eliminar);

module.exports = router;

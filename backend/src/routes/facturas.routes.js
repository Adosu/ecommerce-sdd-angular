const express = require('express');
const facturasController = require('../controllers/facturas.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verificarToken, facturasController.crear);
router.get('/', verificarToken, facturasController.listar);

module.exports = router;

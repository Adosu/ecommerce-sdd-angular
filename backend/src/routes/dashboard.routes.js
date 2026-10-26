const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/resumen', verificarToken, verificarAdmin, dashboardController.obtenerResumen);

module.exports = router;

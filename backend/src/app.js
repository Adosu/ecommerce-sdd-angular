const cors = require('cors');
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const facturasRoutes = require('./routes/facturas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API E-commerce SDD funcionando correctamente',
  });
});

module.exports = app;

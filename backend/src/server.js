require('dotenv').config();

const app = require('./app');
const { inicializarUsuariosPrueba } = require('./services/auth.service');

const port = process.env.PORT || 3000;

async function iniciarServidor() {
  await inicializarUsuariosPrueba();
  app.listen(port, () => {
    console.log(`Servidor E-commerce SDD escuchando en el puerto ${port}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('No se pudo inicializar el servidor:', error);
  process.exitCode = 1;
});

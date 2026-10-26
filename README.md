# ecommerce-sdd-angular

Sistema de e-commerce desarrollado con Spec Driven Development (SDD), Angular, Node.js, PostgreSQL y CI/CD con GitHub Actions.

## Requisitos

- Node.js y npm
- PostgreSQL

## Backend

1. Crea la base de datos y ejecuta `backend/database/init.sql`.
2. En `backend/`, configura las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `JWT_SECRET`.
3. Instala dependencias y levanta la API:

   ```sh
   cd backend
   npm install
   npm start
   ```

La API escucha en `http://localhost:3000/api`. Al iniciar, crea los usuarios de demostración si aún no existen:

- Administrador: `admin@ecommerce.com` / `admin123`
- Cliente: `cliente@ecommerce.com` / `cliente123`

## Frontend

Con el backend en ejecución, instala dependencias y arranca Angular:

```sh
cd frontend
npm install
npm start
```

La aplicación consume la API en `http://localhost:3000/api`. Para compilar la aplicación de producción:

```sh
npm run build
```

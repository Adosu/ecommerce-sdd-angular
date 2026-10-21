CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente'
        CHECK (rol IN ('admin', 'cliente')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE facturas (
    id_factura SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios (id_usuario),
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    iva NUMERIC(10, 2) NOT NULL CHECK (iva >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE detalle_factura (
    id_detalle SERIAL PRIMARY KEY,
    id_factura INT NOT NULL REFERENCES facturas (id_factura),
    id_producto INT NOT NULL REFERENCES productos (id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal_linea NUMERIC(10, 2) NOT NULL CHECK (subtotal_linea >= 0)
);

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, activo)
VALUES
    (
        'Laptop Lenovo IdeaPad Slim 3',
        'Laptop de 15.6 pulgadas, 8 GB de RAM y SSD de 512 GB.',
        649.99,
        18,
        'https://example.com/images/lenovo-ideapad-slim-3.jpg',
        TRUE
    ),
    (
        'Apple iPhone 15',
        'Smartphone con pantalla OLED de 6.1 pulgadas y 128 GB.',
        799.00,
        12,
        'https://example.com/images/iphone-15.jpg',
        TRUE
    ),
    (
        'Samsung Galaxy Tab S9 FE',
        'Tablet de 10.9 pulgadas con 128 GB de almacenamiento.',
        449.99,
        15,
        'https://example.com/images/galaxy-tab-s9-fe.jpg',
        TRUE
    ),
    (
        'Sony WH-1000XM5',
        'Audifonos inalambricos con cancelacion de ruido.',
        349.99,
        24,
        'https://example.com/images/sony-wh-1000xm5.jpg',
        TRUE
    ),
    (
        'Logitech MX Master 3S',
        'Mouse inalambrico ergonomico con sensor de 8000 DPI.',
        99.99,
        30,
        'https://example.com/images/logitech-mx-master-3s.jpg',
        TRUE
    );

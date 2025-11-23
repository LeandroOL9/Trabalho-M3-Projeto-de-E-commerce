-- #################################################################
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS E TABELAS - E-COMMERCE M3
-- #################################################################

CREATE DATABASE IF NOT EXISTS ecommerce;

USE ecommerce;

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,

    CONSTRAINT uq_email UNIQUE (email),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY, 
    title VARCHAR(191) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(191),
    image_url VARCHAR(191),

    stock INT NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    e
    FOREIGN KEY (client_id) REFERENCES clients(id) 
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,

    price DECIMAL(10, 2) NOT NULL, 
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
);
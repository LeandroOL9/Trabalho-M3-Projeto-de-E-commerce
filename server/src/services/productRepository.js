import pool from '../db/pool.js';

export const upsertProduct = async (product) => {
    const { id, title, price, description, category, image_url, stock } = product;
    const finalSql = `
        INSERT INTO products (id, title, price, description, category, image_url, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            price = VALUES(price),
            description = VALUES(description),
            category = VALUES(category),
            image_url = VALUES(image_url);
    `;
    const values = [id, title, price, description, category, image_url, stock];
    await pool.execute(finalSql, values);
};

export const batchUpsertProducts = async (products) => {
    const promises = products.map(upsertProduct);
    return Promise.all(promises);
};

export const findProducts = async (category, search) => {
    let sql = `
        SELECT id, title, price, description, category, image_url, stock
        FROM products
        WHERE 1=1
    `;
    const params = [];

    if (category) {
        sql += ` AND category = ?`;
        params.push(category);
    }

    if (search) {
        sql += ` AND (title LIKE ? OR description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY title ASC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
};

export const findProductById = async (id) => {
    const sql = `
        SELECT id, title, price, description, category, image_url, stock, createdAt
        FROM products
        WHERE id = ?
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0];
};

export const getProductStock = async (productId) => {
    const sql = `SELECT stock FROM products WHERE id = ?`;
    const [rows] = await pool.execute(sql, [productId]);
    
    return rows[0] ? rows[0].stock : 0;
};

export const decreaseProductStock = async (productId, quantity, connection = pool) => {
    const sql = `
        UPDATE products 
        SET stock = stock - ? 
        WHERE id = ? AND stock >= ?
    `;
    const [result] = await connection.execute(sql, [quantity, productId, quantity]);
    return result.affectedRows > 0;
};
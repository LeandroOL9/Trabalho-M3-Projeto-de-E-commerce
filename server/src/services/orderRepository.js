import pool from '../db/pool.js';
import { decreaseProductStock } from './productRepository.js';

export const upsertClient = async (name, email) => {
    const sql = `
        INSERT INTO clients (name, email)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name);
    `;
    await pool.execute(sql, [name, email]);
    
    const [clientRow] = await pool.execute('SELECT id FROM clients WHERE email = ?', [email]);
    return clientRow[0].id;
};

export const createOrderTransaction = async (clientId, total, items) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (client_id, total) VALUES (?, ?)',
            [clientId, total]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            const { product_id, quantity, price } = item;

            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, product_id, quantity, price]
            );

            const success = await decreaseProductStock(product_id, quantity, connection); 

            if (!success) {
                throw new Error(`Falha ao diminuir estoque para o produto ID ${product_id}.`);
            }
        }

        await connection.commit();
        return orderId;

    } catch (error) {
        await connection.rollback(); 
        throw error;
    } finally {
        connection.release();
    }
};

export const listClientOrders = async (email) => {
    const [clientRow] = await pool.execute('SELECT id FROM clients WHERE email = ?', [email]);
    const clientId = clientRow[0]?.id;

    if (!clientId) return [];

    const sql = `
        SELECT 
            o.id AS orderId,
            o.total,
            o.createdAt AS orderDate,
            oi.quantity,
            oi.price AS unitPrice,
            p.title AS productTitle
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.client_id = ?
        ORDER BY o.createdAt DESC
    `;
    const [rows] = await pool.execute(sql, [clientId]);
    
    const ordersMap = new Map();
    rows.forEach(row => {
        if (!ordersMap.has(row.orderId)) {
            ordersMap.set(row.orderId, {
                id: row.orderId,
                total: parseFloat(row.total),
                date: row.orderDate,
                products: []
            });
        }
        ordersMap.get(row.orderId).products.push({
            title: row.productTitle,
            quantity: row.quantity,
            unitPrice: parseFloat(row.unitPrice),
            subtotal: parseFloat(row.unitPrice) * row.quantity
        });
    });

    return Array.from(ordersMap.values());
};
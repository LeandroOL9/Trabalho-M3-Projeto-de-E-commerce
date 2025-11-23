import { getProductStock } from '../services/productRepository.js';
import { upsertClient, createOrderTransaction, listClientOrders as listOrdersRepo } from '../services/orderRepository.js';

export const validateStock = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const requiredQuantity = parseInt(quantity, 10);
        
        if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
            return res.status(400).json({ error: 'Quantidade inválida.' });
        }

        const currentStock = await getProductStock(productId);

        if (currentStock === 0) {
             return res.status(404).json({ error: 'Produto não encontrado ou indisponível.' });
        }
        
        if (currentStock < requiredQuantity) {
            return res.status(409).json({ 
                error: `Estoque insuficiente. Disponível: ${currentStock}.`,
                availableStock: currentStock
            });
        }

        return res.status(200).json({ message: 'Estoque suficiente.', availableStock: currentStock });

    } catch (error) {
        return res.status(500).json({ error: 'Falha interna do servidor.' });
    }
};

export const createOrder = async (req, res) => {
    const { client, items } = req.body;
    let total = 0;

    if (!client || !client.name || !client.email || !items || items.length === 0) {
        return res.status(400).json({ error: 'Dados do pedido incompletos.' });
    }

    try {
        for (const item of items) {
            const requiredQuantity = parseInt(item.quantity, 10);
            const currentStock = await getProductStock(item.product_id);

            if (currentStock < requiredQuantity) {
                return res.status(409).json({ 
                    error: `Estoque insuficiente para o produto ID ${item.product_id}.`,
                    availableStock: currentStock 
                });
            }
            total += item.price * requiredQuantity;
        }

        const clientId = await upsertClient(client.name, client.email);
        const orderId = await createOrderTransaction(clientId, total, items);

        return res.status(201).json({ 
            message: 'Pedido criado com sucesso!', 
            orderId: orderId,
            total: total
        });

    } catch (error) {
        return res.status(500).json({ error: 'Falha ao processar o pedido. Tente novamente.', details: error.message });
    }
};

export const listClientOrders = async (req, res) => {
    try {
        const clientEmail = req.params.email;

        if (!clientEmail) {
            return res.status(400).json({ error: 'O e-mail do cliente é obrigatório.' });
        }

        const orders = await listOrdersRepo(clientEmail);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Nenhum pedido encontrado para este e-mail.' });
        }

        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar as compras do cliente.' });
    }
};
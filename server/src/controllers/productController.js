import { fetchAndMapProducts } from '../services/productService.js';
import { batchUpsertProducts,findProducts, findProductById } from '../services/productRepository.js';

export const importProducts = async (req, res) => {
    try {  
        const productsToInsert = await fetchAndMapProducts();
        await batchUpsertProducts(productsToInsert);

        return res.status(200).json({ 
            message: 'Importação de produtos concluída com sucesso.',
            totalProcessed: productsToInsert.length
        });
        
    } catch (error) {
        return res.status(500).json({ 
            error: 'Falha interna do servidor ao importar produtos.', 
            details: error.message 
        });
    }
};

export const listProducts = async (req, res) => {
    try {
        const { category, search } = req.query; 
        const products = await findProducts(category, search);

        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar produtos.' });
    }
};

export const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await findProductById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar detalhes do produto.' });
    }
};
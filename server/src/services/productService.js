const FAKESTORE_API_URL = 'https://fakestoreapi.com'; 

export const fetchAndMapProducts = async () => {
    try {
        const response = await fetch(`${FAKESTORE_API_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`API Externa retornou status: ${response.status}`);
        }
        const fakeStoreProducts = await response.json();

        const productsToInsert = fakeStoreProducts.map(product => ({
            id: product.id, 
            title: product.title,
            price: product.price,
            description: product.description,
            category: product.category,
            image_url: product.image, 
            stock: 100,
        }));

        return productsToInsert;

    } catch (error) {
        throw new Error(`Falha ao buscar produtos da FakeStore: ${error.message}`);
    }
};
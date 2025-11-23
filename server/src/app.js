import express from 'express';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
const app = express();

app.use(express.json());

app.use('/api', productRoutes);
app.use('/api', orderRoutes);

app.get('/', (req, res) => {
    res.send('Servidor E-commerce em execução! Use /api/...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: http://localhost:${PORT}`)
});
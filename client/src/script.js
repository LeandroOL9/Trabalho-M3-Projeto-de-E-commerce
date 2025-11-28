import { buscarProdutos } from './utils/busca.js';
import { extractCategories, populateCategorySelect, onCategoryChange } from './utils/categoria.js';
import { initCartSubmitSimple } from './cartSubmitSimple.js';
import { initMyOrders } from './orders/myOrders.js';
import { readJSON, writeJSON } from './utils/storage.js';

(async function () {
 "use strict";

 const response = await fetch('http://localhost:3000/api/products/');
 const products = await response.json();

 const listaProdutos = document.getElementById('lista-produtos');
 const inputPesquisa = document.getElementById('pesquisa');
 const selectCategorias = document.getElementById('todasCategorias')

const COUNTS_KEY = 'ecom_counts';
function readCounts() {
    try { const raw = readJSON(COUNTS_KEY); return raw ? raw : {}; } catch (e) { console.error('readCounts error', e); return {}; }
}
function writeCounts(obj) { try { writeJSON(COUNTS_KEY, obj); } catch (e) { console.error('writeCounts error', e); } }
function getCount(productId) { const c = readCounts(); return Number(c[productId] || 0); }
function setCount(productId, qty) { const c = readCounts(); c[productId] = qty; writeCounts(c); }

function renderProducts(productsToRender) {
    const toRender = productsToRender ?? products;
    listaProdutos.innerHTML = '';
       toRender.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'col-md-4';

        const cardInner = document.createElement('div');
        cardInner.className = 'card h-100 text-center';

        const img = document.createElement('img');
        img.className = 'card-img-top mt-4 mb-4';
        img.src = product.image_url;
        img.alt = product.title;

        const categoria = document.createElement('a');
        categoria.className = 'card-text text-muted';
        categoria.textContent = " Categoria " + product.category;

        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = 'Comprar';
        button.dataset.productId = product.id;
        button.dataset.stock = product.stock ?? 0;

        const countEl = document.createElement('span');
        countEl.className = 'badge bg-secondary ms-2';
        countEl.setAttribute('data-count-id', product.id);
        const persistedQty = getCount(product.id);
        countEl.textContent = String(persistedQty);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = product.title;

        const description = document.createElement('p');
        description.className = 'card-text text-truncate';
        description.textContent = product.description;

        const price = document.createElement('p');
        price.className = 'card-text text-success';
        price.textContent = `R$ ${product.price}`;

        const stockEl = document.createElement('p');
        const stockQty = Number(product.stock ?? 0);
        if (stockQty > 0) {
            stockEl.className = 'card-text text-muted';
            stockEl.textContent = `Estoque: ${stockQty}`;
            const currentSelected = persistedQty;
            if (currentSelected >= stockQty) {
                button.disabled = true;
                button.textContent = 'Esgotado';
            } else {
                button.disabled = false;
            }
        } else {
            stockEl.className = 'card-text text-danger';
            stockEl.textContent = 'Esgotado';
            button.disabled = true;
            button.textContent = 'Esgotado';
        }

        cardBody.appendChild(title);
        cardBody.appendChild(description);
        cardBody.appendChild(categoria);
        cardBody.appendChild(price);
        cardBody.appendChild(stockEl);
        cardBody.appendChild(button);
        cardBody.appendChild(countEl);
        cardInner.appendChild(img);
        cardInner.appendChild(cardBody);
        card.appendChild(cardInner);
        listaProdutos.appendChild(card);
    });
}

let debounceTimer;
inputPesquisa.addEventListener('input', () => {
    const termo = inputPesquisa.value.trim();
    const categoriaSelecionada = selectCategorias ? selectCategorias.value : '';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            if (!termo) {
                if (categoriaSelecionada) {
                    const produtos = await buscarProdutos({ category: categoriaSelecionada });
                    renderProducts(produtos);
                } else {
                    renderProducts();
                }
                return;
            }

            const produtos = await buscarProdutos({ search: termo, category: categoriaSelecionada });
            renderProducts(produtos);
        } catch (err) {
            console.error('Erro ao buscar produtos no servidor:', err);
        }
    }, 300);
});


renderProducts();

listaProdutos.addEventListener('click', (evt) => {
    const btn = evt.target.closest('button');
    if (!btn) return;
    const productId = btn.dataset.productId;
    if (!productId) return;

    const stock = Number(btn.dataset.stock || 0);
    const countEl = listaProdutos.querySelector(`span[data-count-id="${productId}"]`);
    if (!countEl) return;

    let current = Number(countEl.textContent || 0);
    if (current >= stock) {
        btn.disabled = true;
        btn.textContent = 'Esgotado';
        return;
    }

    current += 1;
    countEl.textContent = String(current);
    try { setCount(productId, current); } catch (e) { console.error('Erro ao persistir contador', e); }

    if (current >= stock) {
        btn.disabled = true;
        btn.textContent = 'Esgotado';
    } else {
        const prevText = btn.textContent;
        btn.textContent = 'Adicionado';
        setTimeout(() => { btn.textContent = prevText; }, 300);
    }
});

try {
    const categories = extractCategories(products);
    populateCategorySelect(selectCategorias, categories,);

    onCategoryChange(selectCategorias, async (cat) => {
        try {
            if (!cat) {
                renderProducts();
                return;
            }
            const produtos = await buscarProdutos({ category: cat });
            renderProducts(produtos);
        } catch (err) {
            console.error('Erro ao buscar produtos por categoria:', err);
        }
    });
} catch (err) {
    console.error('Erro ao popular categorias:', err);
}

try {
    initCartSubmitSimple('#cartButton');
} catch (err) {
    console.error('Erro ao inicializar cart submit simple:', err);
}

try { initMyOrders(); } catch (e) { console.error('Erro ao inicializar Minhas Compras:', e); }

})();

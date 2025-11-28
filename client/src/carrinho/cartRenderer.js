// src/carrinho/cartRenderer.js
// Renderiza o carrinho a partir de um array salvo em sessionStorage

import { decreaseCartItem, increaseCartItem } from './quantityHandler.js';

function formatCurrency(v) {
  return typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v;
}

export function renderCartFromSession(container) {
  const el =  document.querySelector(container);
  if (!el) return;

  // Lê o carrinho persistido em localStorage (chave: ecom_cart)
  const raw = localStorage.getItem('ecom_cart');
  let items = [];
  try { items = raw ? JSON.parse(raw) : []; } catch (e) { console.error('Falha ao parsear ecom_cart', e); items = []; }

  if (!items || items.length === 0) {
    // mostra mensagem mas mantém botão de checkout visível e desabilitado
    el.innerHTML = `
      <div>
        <p>Seu carrinho está vazio.</p>
        <button id="checkoutBtn" class="btn btn-primary" disabled>Finalizar compra</button>
      </div>
    `;
    // also disable the external 'Esvaziar carrinho' button if present
    try {
      const clearBtn = document.getElementById('clearCart');
      if (clearBtn) clearBtn.disabled = true;
    } catch (e) { console.error('Erro ao desabilitar clearCart', e); }
    return;

  }

  let total = 0;
  const rows = items.map(it => {
    const img = it.image_url || '';
    const q = Number(it.quantity || 0);
    const price = Number(it.price || 0);
    const subtotal = Number(price * q);
    total += subtotal;
    return `
      <tr>
      <td><img src="${img}" alt="${String(it.title || '')}" style="max-width: 50px; max-height: 50px;" /></td>
        <td>${String(it.title || '—')}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-danger decrease-btn" data-product-id="${it.productId}">-</button>
          <span data-cart-qty="${it.productId}" class="mx-2">${q}</span>
          <button class="btn btn-sm btn-success increase-btn" data-product-id="${it.productId}">+</button>
        </td>
        <td class="text-end">R$ ${formatCurrency(price)}</td>
        <td class="text-end" data-subtotal="${it.productId}">R$ ${formatCurrency(subtotal)}</td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Imagem</th>
          <th> Produto </th>
          <th class="text-center">Qtd</th>
          <th class="text-end">Preço</th>
          <th class="text-end">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-end"><strong>Total</strong></td>
          <td class="text-end"><strong id="cartTotal">R$ ${formatCurrency(total)}</strong></td>
          <td><button id="checkoutBtn" class="btn btn-primary ms-3">Finalizar compra</button></td>
        </tr>
      </tfoot>
    </table>
  `;

  // remove listener anterior (se houver) para evitar duplicação
  if (el._cartHandler) {
    el.removeEventListener('click', el._cartHandler);
    el._cartHandler = null;
  }

  // handler mínimo: delega para o módulo `decreaseCartItem` para aplicar a lógica
  const handler = (evt) => {
    const btn = evt.target.closest('.decrease-btn');
    if (!btn) return;
    const pid = btn.dataset.productId;
    if (!pid) return;
    // decrease handler
    (async () => {
      const result = decreaseCartItem(pid);
      if (!result) return;

      // atualiza DOM com base no retorno
      const { cart, updatedItem, newSubtotal, newTotal } = result;
      const row = btn.closest('tr');
      if (!row) return;

      if (updatedItem) {
        const qtySpan = row.querySelector(`span[data-cart-qty="${pid}"]`);
        if (qtySpan) qtySpan.textContent = String(updatedItem.quantity);
        const subtotalTd = row.querySelector(`[data-subtotal="${pid}"]`);
        if (subtotalTd) subtotalTd.textContent = `R$ ${formatCurrency(newSubtotal)}`;
      } else {
        row.remove();
      }

      const totalEl = document.getElementById('cartTotal');
      if (totalEl) totalEl.textContent = `R$ ${formatCurrency(newTotal)}`;

      if (!cart || cart.length === 0) {
        el.innerHTML = `
          <div>
            <p>Seu carrinho está vazio.</p>
            <button id="checkoutBtn" class="btn btn-primary" disabled>Finalizar compra</button>
          </div>`;
        try { const clearBtn = document.getElementById('clearCart'); if (clearBtn) clearBtn.disabled = true; } catch (e) { console.error('Erro ao desabilitar clearCart', e); }
      }
    })();
  };

  // handler para increase (async)
  const handlerIncrease = async (evt) => {
    const btn = evt.target.closest('.increase-btn');
    if (!btn) return;
    const pid = btn.dataset.productId;
    if (!pid) return;

    const row = btn.closest('tr');
    if (!row) return;

    // chama a função assíncrona que valida no backend e atualiza o armazenamento
    const result = await increaseCartItem(pid);

    if (!result) return;

    if (result.error) {
      if (result.error === 'insufficient') {
        alert(`Estoque insuficiente. Disponível: ${result.availableStock}`);
      } else {
        console.error('increase error', result);
        alert('Erro ao aumentar quantidade. Tente novamente.');
      }
      return;
    }

    const { cart, updatedItem, newSubtotal, newTotal } = result;
    const qtySpan = row.querySelector(`span[data-cart-qty="${pid}"]`);
    if (qtySpan) qtySpan.textContent = String(updatedItem.quantity);
    const subtotalTd = row.querySelector(`[data-subtotal="${pid}"]`);
    if (subtotalTd) subtotalTd.textContent = `R$ ${formatCurrency(newSubtotal)}`;
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `R$ ${formatCurrency(newTotal)}`;
  };

  // attach both handlers (delegation)
  if (el._cartHandler) {
    el.removeEventListener('click', el._cartHandler);
    el._cartHandler = null;
  }
  el.addEventListener('click', handler);
  el.addEventListener('click', handlerIncrease);
  el._cartHandler = handler;

  // enable the external clear button if present
  try {
    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) clearBtn.disabled = false;
  } catch (e) { console.error('Erro ao habilitar clearCart', e); }
}

import { renderCartFromSession } from './cartRenderer.js';

function readCart() {
  try { const raw = localStorage.getItem('ecom_cart'); return raw ? JSON.parse(raw) : []; } catch (e) { console.error('readCart parse error', e); return []; }
}

function createModal() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.left = 0;
  overlay.style.top = 0;
  overlay.style.right = 0;
  overlay.style.bottom = 0;
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 10000;

  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '20px';
  box.style.maxWidth = '800px';
  box.style.width = '90%';
  box.style.maxHeight = '90%';
  box.style.overflow = 'auto';
  box.className = 'checkout-modal';

  overlay.appendChild(box);
  return { overlay, box };
}

function formatCurrency(v) { return typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v; }

function buildSummaryHtml(cart) {
  if (!cart || cart.length === 0) return '<p>Seu carrinho está vazio.</p>';
  let total = 0;
  const rows = cart.map(it => {
    const q = Number(it.quantity || 0);
    const price = Number(it.price || 0);
    const subtotal = q * price;
    total += subtotal;
    return `<tr>
      <td>${String(it.title || '')}</td>
      <td class="text-center">${q}</td>
      <td class="text-end">R$ ${formatCurrency(price)}</td>
      <td class="text-end">R$ ${formatCurrency(subtotal)}</td>
    </tr>`;
  }).join('');

  return `
    <table class="table">
      <thead><tr><th>Produto</th><th class="text-center">Qtd</th><th class="text-end">Preço</th><th class="text-end">Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3" class="text-end"><strong>Total</strong></td><td class="text-end"><strong>R$ ${formatCurrency(total)}</strong></td></tr></tfoot>
    </table>`;
}

export function initCheckout() {
  document.addEventListener('click', async (evt) => {
    const btn = evt.target.closest ? evt.target.closest('#checkoutBtn') : null;
    if (!btn) return;

    evt.preventDefault();

    const cart = readCart();
    if (!cart || cart.length === 0) {
      alert('Carrinho vazio. Adicione itens antes de finalizar a compra.');
      return;
    }

    const { overlay, box } = createModal();

    box.innerHTML = `
      <h4>Finalizar compra</h4>
      <div id="checkoutMessage"></div>
      <form id="checkoutForm">
        <div class="mb-3">
          <label>Nome</label>
          <input type="text" id="clientName" class="form-control" required />
        </div>
        <div class="mb-3">
          <label>Email</label>
          <input type="email" id="clientEmail" class="form-control" required />
        </div>
        <h5>Resumo do carrinho</h5>
        <div id="checkoutSummary">${buildSummaryHtml(cart)}</div>
        <div class="d-flex justify-content-end mt-3">
          <button type="button" id="cancelCheckout" class="btn btn-secondary me-2">Cancelar</button>
          <button type="submit" id="confirmCheckout" class="btn btn-primary">Finalizar compra</button>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);

    const form = box.querySelector('#checkoutForm');
    const cancel = box.querySelector('#cancelCheckout');
    const msgEl = box.querySelector('#checkoutMessage');

    cancel.addEventListener('click', () => {
      overlay.remove();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgEl.textContent = '';
      const name = box.querySelector('#clientName').value.trim();
      const email = box.querySelector('#clientEmail').value.trim();
      if (!name || !email) {
        msgEl.textContent = 'Preencha nome e email.';
        return;
      }

      const payload = {
        client: { name, email },
        items: cart.map(it => ({
          product_id: it.productId,
          quantity: Number(it.quantity),
          price: Number(it.price),
          title: it.title || it.name || null,
          image_url: it.image_url || it.image || null
        }))
      };

      const submitBtn = box.querySelector('#confirmCheckout');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const res = await fetch('http://localhost:3000/api/orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const j = await res.json().catch(() => ({}));
          if (res.ok) {
          const orderId = j && (j.id || j.orderId || j.order_id) ? (j.id || j.orderId || j.order_id) : null;
          try { localStorage.removeItem('ecom_cart'); } catch (e) { console.error('Erro ao remover ecom_cart após pedido', e); }
          try { localStorage.removeItem('ecom_counts'); } catch (e) { console.error('Erro ao remover ecom_counts após pedido', e); }
          try { renderCartFromSession('#cartContainer'); } catch (e) { console.error('Erro ao re-renderizar carrinho', e); }

          overlay.remove();
          const successMsg = orderId ? `Pedido criado com sucesso. Nº ${orderId}` : 'Pedido criado com sucesso.';
          alert(successMsg);
        } else {
          const err = j && j.error ? j.error : (j.message || 'Erro ao criar pedido');
          msgEl.textContent = `Erro: ${err}`;
        }
      } catch (err) {
        msgEl.textContent = 'Erro de rede ao enviar pedido.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Finalizar compra';
      }
    });
  });
}

export function initCartSubmitSimple(selector) {
  const el = document.querySelector(selector)
  if (!el) return;

  el.addEventListener('click', async (evt) => {
    evt.preventDefault();

    const items = [];
    document.querySelectorAll('span[data-count-id]').forEach((span) => {
      const qty = Number(span.textContent || 0);
      if (qty > 0) {
        const productId = span.getAttribute('data-count-id');
        items.push({ productId: Number(productId),  quantity: qty,});
      }
    });

    if (items.length === 0) {
      alert('Nenhum item selecionado (contador = 0).');
      return;
    }

    try {
      const validated = [];

      for (const it of items) {
        const res = await fetch('http://localhost:3000/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: it.productId, quantity: it.quantity })
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = resJson && resJson.error ? resJson.error : 'Erro ao validar o produto';
          alert(msg);
          return;
        }

        let product = null;
        try {
          const p = await fetch(`http://localhost:3000/api/products/${it.productId}`);
          if (p.ok) product = await p.json().catch(() => null);
        } catch (e) {
          product = null;
        }

        const title = product.title || '';
        const price = product.price ? Number(product.price) : 0;
        const subtotal = price * it.quantity;
        const img = product.image_url || '';

        validated.push({
          productId: it.productId,
          title,
          quantity: it.quantity,
          price,
          subtotal,
          availableStock: resJson.availableStock ?? null,
          image_url: img
        });
      }

      try {
        localStorage.setItem('ecom_cart', JSON.stringify(validated));
      } catch (e) {
        console.warn('Não foi possível salvar validated cart em localStorage', e);
      }

      try {
        const COUNTS_KEY = 'ecom_counts';
        const raw = localStorage.getItem(COUNTS_KEY);
        const counts = raw ? JSON.parse(raw) : {};
        validated.forEach(it => { counts[it.productId] = Number(it.quantity || 0); });
        localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
      } catch (e) {
      }

      window.location.href = 'cart.html';
    } catch (err) {
      console.error('Erro ao validar itens:', err);
      alert('Erro de rede ao validar itens. Veja console.');
    }
  });
}

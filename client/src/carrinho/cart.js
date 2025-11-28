import { renderCartFromSession } from './cartRenderer.js';
import { initCheckout } from './checkout.js';

function setupButtons() {
  const clearBtn = document.getElementById('clearCart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      try { localStorage.removeItem('ecom_cart'); } catch (e) { console.error('Erro ao remover ecom_cart', e); }
      try { localStorage.removeItem('ecom_counts'); } catch (e) { console.error('Erro ao remover ecom_counts', e); }
      renderCartFromSession('#cartContainer');
      
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartFromSession('#cartContainer');
  setupButtons();
  try { initCheckout(); } catch (e) { console.error('Erro ao inicializar checkout:', e); }
});

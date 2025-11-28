import { readJSON, writeJSON } from '../utils/storage.js';

export function decreaseCartItem(productId) {
  const pid = String(productId);
  const cart = readJSON('ecom_cart') || [];
  const counts = readJSON('ecom_counts') || {};

  const idx = cart.findIndex(x => String(x.productId) === pid);
  if (idx === -1) return null;

  const currentQty = Math.max(0, Number(cart[idx].quantity || 0) - 1);
  if (currentQty > 0) {
    cart[idx].quantity = currentQty;
    counts[pid] = currentQty;
  } else {
    cart.splice(idx, 1);
    delete counts[pid];
  }

  writeJSON('ecom_cart', cart);
  writeJSON('ecom_counts', counts);

  const updatedItem = cart.find(x => String(x.productId) === pid) || null;
  const newSubtotal = updatedItem ? Number(updatedItem.quantity || 0) * Number(updatedItem.price || 0) : 0;
  let newTotal = 0;
  cart.forEach(it => { newTotal += Number(it.price || 0) * Number(it.quantity || 0); });

  return { cart, updatedItem, newSubtotal, newTotal };
}

export async function increaseCartItem(productId) {
  const pid = String(productId);
  const cart = readJSON('ecom_cart') || [];
  const counts = readJSON('ecom_counts') || {};

  const idx = cart.findIndex(x => String(x.productId) === pid);
  if (idx === -1) return { error: 'not_found' };

  const desiredQty = Number(cart[idx].quantity || 0) + 1;

  try {
    const res = await fetch('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(pid), quantity: desiredQty })
    });

    if (!res.ok) {
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        return { error: 'insufficient', availableStock: data.availableStock };
      }
      const txt = await res.text();
      return { error: 'server', details: txt };
    }

    cart[idx].quantity = desiredQty;
    counts[pid] = desiredQty;

    writeJSON('ecom_cart', cart);
    writeJSON('ecom_counts', counts);

    const updatedItem = cart[idx];
    const newSubtotal = Number(updatedItem.quantity || 0) * Number(updatedItem.price || 0);
    let newTotal = 0;
    cart.forEach(it => { newTotal += Number(it.price || 0) * Number(it.quantity || 0); });

    return { cart, updatedItem, newSubtotal, newTotal };

  } catch (error) {
    console.error('increaseCartItem error', error);
    return { error: 'network', details: error.message };
  }
}

function fmt(v){ return Number.isFinite(Number(v)) ? Number(Number(v)).toFixed(2).replace('.',',') : '0,00'; }
function fdate(s){ try{ return new Date(s).toLocaleString(); }catch(e){ return String(s||''); } }

function renderOrder(o){
  const total = o.total || o.total_amount || o.value || 0;
  const date = o.created_at || o.date || o.createdAt || o.timestamp || '';
  const items = Array.isArray(o.items) ? o.items : (Array.isArray(o.products) ? o.products : []);
  const itemsHtml = (items||[]).map(it=>{
    const name = it.title || it.name || it.product_name || 'Produto';
    const qty = Number(it.quantity || it.qty || it.qtd || 1) || 1;
    const price = Number(it.unitPrice ?? it.unit_price ?? it.price ?? it.value ?? 0) || 0;
    const subtotal = Number(it.subtotal ?? it.line_total ?? (qty * price)) || (qty * price);
    const img = it.image || it.image_url || it.img || '';
    const imgHtml = img ? `<div><img src="${img}" alt="${name}" style="width:56px;height:auto;display:block;margin-top:4px"></div>` : '';
    return `<li style="margin-bottom:8px;"><strong>${name}</strong>${imgHtml}<div class="small text-muted">qtd: ${qty} — R$ ${fmt(subtotal)} <span class="text-muted" style="margin-left:6px;font-size:0.85em">(uni R$ ${fmt(price)})</span></div></li>`;
  }).join('');
  return `
    <div class="card mb-3">
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>Pedido</strong> — <small>${fdate(date)}</small></div>
          <div><strong>R$ ${fmt(total)}</strong></div>
        </div>
        <ul style="margin-top:10px;padding-left:18px">${itemsHtml}</ul>
      </div>
    </div>`;
}

export function initMyOrders(){
  const input = document.getElementById('email');
  const btn = document.getElementById('buscarPedidos');
  const list = document.getElementById('meusPedidosList');
  if(!input || !btn || !list) return;
  btn.addEventListener('click', async ()=>{
    const email = (input.value||'').trim();
    list.innerHTML = '';
    if(!email){ list.innerHTML = '<div class="text-danger">Digite um e‑mail.</div>'; return; }
    btn.disabled = true; btn.textContent = 'Buscando...';
    try{
      const res = await fetchOrders(email);
      if (!res) { list.innerHTML = `<div class="text-danger">Erro: sem resposta do servidor.</div>`; return; }
      if(!res.ok){
        const txt = await res.text().catch(()=>res.statusText||'');
        list.innerHTML = `<div class="text-danger">Erro: ${res.status} ${res.statusText} — ${txt}</div>`;
        return;
      }
      const orders = await res.json().catch(()=>[]);
      if(!orders || orders.length === 0){ list.innerHTML = '<div>Nenhum pedido encontrado.</div>'; return; }
      list.innerHTML = orders.map(renderOrder).join('');
    }catch(e){
      list.innerHTML = '<div class="text-danger">Erro de rede ao buscar pedidos.</div>';
    }finally{ btn.disabled = false; btn.textContent = 'Buscar pedidos'; }
  });
}

async function fetchOrders(email) {
  try {
    const url = `http://localhost:3000/api/clients/${email}/orders`;
    console.debug('Fetching orders from', url);
    return await fetch(url);
  } catch (e) {
    console.debug('Failed fetching orders for', email, e);
    return null;
  }
}

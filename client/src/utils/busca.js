export async function buscarProdutos({ category, search } = {}) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const base = 'http://localhost:3000/api/products';
  const url = params.toString() ? `${base}?${params.toString()}` : base;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Erro ao buscar produtos: ${res.status} ${text}`);
  }
  return res.json();
}

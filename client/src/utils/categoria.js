export function extractCategories(products) {
  return Array.from(
    new Set(products.map(p => (p.category || '').toString().trim()).filter(Boolean))
  ).sort();
}

export function populateCategorySelect(selectEl, categories) {
  if (!selectEl) return;

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    selectEl.appendChild(opt);
  });
}

export function onCategoryChange(selectEl, handler) {
  selectEl.addEventListener('change', (e) => handler(e.target.value));
}
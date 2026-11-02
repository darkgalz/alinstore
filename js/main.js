// Configura aquí tu ID aprobado de Amazon Associates antes de publicar.
const CONFIG = { affiliateTag: 'CAMBIAR-TAG-20', currency: 'USD', locale: 'es-EC' };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const PRODUCT_KEY = 'alin-store-products-v1';
const state = { products: [], category: 'Todas', query: '' };
const hasAffiliateTag = () => Boolean(CONFIG.affiliateTag && !/^CAMBIAR|TUTAG/i.test(CONFIG.affiliateTag));
const validAmazonUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' && /(^|\.)amazon\.[a-z.]+$/i.test(u.hostname); } catch { return false; } };
function affiliateUrl(url) {
  if (!validAmazonUrl(url) || !hasAffiliateTag()) return '';
  const u = new URL(url); u.searchParams.set('tag', CONFIG.affiliateTag); return u.href;
}
const priceText = p => p.price != null && Number.isFinite(Number(p.price))
  ? new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency }).format(Number(p.price))
  : 'Consulta el precio actual';
const stars = r => Number.isFinite(Number(r)) && Number(r) > 0
  ? `<span class="stars" role="img" aria-label="${esc(Number(r).toFixed(1))} de 5 estrellas">${'★'.repeat(Math.round(r))}${'☆'.repeat(5 - Math.round(r))}</span> <span>${Number(r).toFixed(1)}</span>` : '';
const list = (arr, cls) => `<ul class="${cls}">${(arr || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
const cta = p => {
  const url = affiliateUrl(p.amazonUrl);
  return url ? `<a class="btn-cta" data-product-link data-product-id="${esc(p.id)}" href="${esc(url)}" target="_blank" rel="sponsored nofollow noopener">Ver en Amazon <span>↗</span></a>` : `<span class="btn-disabled">${hasAffiliateTag() ? 'Configura el enlace Amazon' : 'Configura tu ID de afiliado'}</span>`;
};
function visibleProducts() { return state.products.filter(p => p.active !== false); }
function matches(p) {
  const okCat = state.category === 'Todas' || p.category === state.category;
  if (!state.query) return okCat;
  const hay = norm([p.title, p.category, p.description, ...(p.tags || [])].join(' '));
  return okCat && norm(state.query).split(/\s+/).filter(Boolean).every(t => hay.includes(t));
}
function renderCategories() {
  const cats = ['Todas', ...new Set(visibleProducts().map(p => p.category).filter(Boolean))];
  if (!cats.includes(state.category)) state.category = 'Todas';
  $('#categories').innerHTML = cats.map(c => `<button class="chip" aria-pressed="${c === state.category}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}
function renderGrid() {
  const items = visibleProducts().filter(matches);
  $('#result-count').textContent = `${items.length} producto${items.length === 1 ? '' : 's'}`;
  $('#grid').innerHTML = items.length ? items.map(p => `
    <article class="product-card">
      <div class="product-visual"><img src="${esc(p.image || 'https://placehold.co/700x610/e8e9dc/315f4b?text=Alin+Store')}" alt="${esc(p.title)}" loading="lazy" width="700" height="610">
      ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ''}</div>
      <div class="product-info"><span class="product-category">${esc(p.category || 'Selección')}</span>
        <h3>${esc(p.title)}</h3><p class="product-description">${esc(p.description || 'Descubre los detalles de este producto y consulta sus características en Amazon.')}</p>
        <div class="product-meta">${stars(p.rating)}</div><p class="price-line">${priceText(p)}${p.price != null ? ' <small>· referencia</small>' : ''}</p>
        <div class="product-actions">${cta(p)}<button class="btn-ghost" data-id="${esc(p.id)}">Detalles</button></div>
      </div>
    </article>`).join('') : `<div class="empty-state"><h3>${state.products.length ? 'Aún no hay coincidencias' : 'Tu selección empieza aquí'}</h3><p>${state.products.length ? 'Prueba con otra búsqueda o categoría.' : 'Añade tus productos desde “Administrar tienda” para que aparezcan aquí.'}</p></div>`;
  const notice = $('#sample-notice');
  if (notice) notice.hidden = !state.products.some(p => p.demo);
}
function openProduct(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const specs = Object.entries(p.specs || {}).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  $('#modal-body').innerHTML = `<div class="dialog-content"><div class="dialog-top"><div><span class="product-category">${esc(p.category || '')}</span><h2 id="modal-title">${esc(p.title)}</h2></div><button class="dialog-close" aria-label="Cerrar" data-close>×</button></div>
      <img src="${esc(p.image || 'https://placehold.co/700x610/e8e9dc/315f4b?text=Alin+Store')}" alt="${esc(p.title)}" class="dialog-image" width="700" height="610">
      <div class="product-meta">${stars(p.rating)}</div><p>${esc(p.review || p.description || '')}</p>
      <div class="dialog-lists"><div><h3>Lo que debes saber</h3>${list(p.pros, 'pros')}</div>${p.cons?.length ? `<div><h3>Ten en cuenta</h3>${list(p.cons, 'cons')}</div>` : ''}</div>
      ${specs ? `<table><caption class="sr-only">Especificaciones</caption>${specs}</table>` : ''}<p class="price-line">${priceText(p)}</p>${cta(p)}<p class="text-muted">Los precios, reseñas y disponibilidad pueden cambiar. Consulta los datos vigentes en Amazon.</p></div>`;
  const m = $('#modal'); if (!m.open) m.showModal();
}
function saveProducts(products) {
  if (!Array.isArray(products)) throw new Error('El catálogo debe ser una lista de productos.');
  localStorage.setItem(PRODUCT_KEY, JSON.stringify(products)); state.products = products;
  renderCategories(); renderGrid(); return products;
}
function bind() {
  const onSearch = () => { state.query = $('#search').value.trim(); renderGrid(); };
  $('#search').addEventListener('input', onSearch);
  $('#search-form')?.addEventListener('submit', e => e.preventDefault());
  $('#search-btn')?.addEventListener('click', onSearch);
  $('#categories').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; state.category = b.dataset.cat; renderCategories(); renderGrid(); });
  $('#grid').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) openProduct(b.dataset.id); });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').close(); });
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-product-link]');
    if (link) window.dispatchEvent(new CustomEvent('alin:outbound-click', { detail: { productId: link.dataset.productId, date: new Date().toISOString() } }));
    const openAdmin = e.target.closest('[data-open-admin]'); if (openAdmin) { e.preventDefault(); window.AlInAdmin?.show(); }
    if (e.target.closest('[data-dismiss-notice]')) { const n = $('#sample-notice'); if (n) n.hidden = true; }
  });
}
async function loadProducts() {
  const saved = localStorage.getItem(PRODUCT_KEY);
  if (saved) { try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; } catch { localStorage.removeItem(PRODUCT_KEY); } }
  const r = await fetch('data/products.json'); if (!r.ok) throw new Error(r.status);
  return await r.json();
}
window.Store = {
  CONFIG, PRODUCT_KEY, state, esc, norm, affiliateUrl, validAmazonUrl, priceText, stars, openProduct, saveProducts, renderGrid, renderCategories, visibleProducts,
  ready: loadProducts().then(data => { state.products = data; renderCategories(); renderGrid(); bind(); $('#year').textContent = new Date().getFullYear(); return data; }).catch(err => {
    $('#grid').innerHTML = '<div class="empty-state"><h3>No se pudo cargar el catálogo</h3><p>Revisa que el servidor se haya iniciado dentro de la carpeta de Alin Store.</p></div>'; console.error(err); return [];
  })
};

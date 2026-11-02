(() => {
  const SALES_KEY = 'alin-store-sales-v1';
  const CLICKS_KEY = 'alin-store-clicks-v1';
  const BACKUP_VERSION = 1;
  let tab = 'products', period = 'day', anchorDate = today(), editingProductId = null, editingSaleId = null;
  let sales = readList(SALES_KEY), clicks = readList(CLICKS_KEY);
  const adminRoot = document.querySelector('#admin-app');
  const storefront = document.querySelector('#storefront');
  const dialog = document.createElement('dialog'); dialog.className = 'admin-dialog'; dialog.id = 'admin-dialog'; document.body.appendChild(dialog);
  const money = n => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
  const esc = s => window.Store?.esc(s) || String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function readList(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
  function saveSales() { localStorage.setItem(SALES_KEY, JSON.stringify(sales)); }
  function saveClicks() { localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks)); }
  function toast(message, error = false) { const region = document.querySelector('#toast-region'); if (!region) return; const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message; region.appendChild(el); setTimeout(() => el.remove(), 3200); }
  function periodStart(date, unit) { const d = new Date(`${date}T12:00:00`); if (unit === 'month') d.setDate(1); if (unit === 'year') { d.setMonth(0); d.setDate(1); } return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function inPeriod(date) { return period === 'day' ? date === anchorDate : period === 'month' ? date.slice(0, 7) === anchorDate.slice(0, 7) : date.slice(0, 4) === anchorDate.slice(0, 4); }
  function periodLabel() { const d = new Date(`${anchorDate}T12:00:00`); return period === 'day' ? d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : period === 'month' ? d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) : String(d.getFullYear()); }
  function moneySum(rows, field) { return rows.reduce((sum, r) => sum + Number(r[field] || 0), 0); }
  function show() { window.Store.ready.then(() => { storefront.hidden = true; adminRoot.hidden = false; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
  function hide() { adminRoot.hidden = true; storefront.hidden = false; window.location.hash = '#inicio'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function render() {
    if (!window.Store) return;
    const products = window.Store.state.products;
    adminRoot.innerHTML = `<div class="admin-shell">
      <button class="admin-back" data-admin-back>← Volver a Alin Store</button>
      <div class="admin-heading"><div><span class="eyebrow">CENTRO DE CONTROL</span><h1>Administrar tienda</h1><p>Catálogo y resultados de tu Alin Store en este navegador.</p></div><div class="admin-toolbar"><button class="admin-button" data-export>Descargar respaldo JSON</button><button class="admin-button" data-import>Restaurar respaldo</button><input hidden type="file" accept="application/json,.json" data-import-file></div></div>
      <div class="admin-warning"><strong>Datos locales:</strong> esta información solo se guarda en este navegador. Amazon no envía compras aquí; registra manualmente los resultados que ves en Associates Central y descarga un respaldo con frecuencia.</div>
      <div class="admin-tabs" role="tablist"><button class="admin-tab" role="tab" aria-selected="${tab === 'products'}" data-tab="products">Productos (${products.length})</button><button class="admin-tab" role="tab" aria-selected="${tab === 'performance'}" data-tab="performance">Ventas y rendimiento</button></div>
      ${tab === 'products' ? productPanel(products) : performancePanel(products)}
      <div class="backup-note">Tag de afiliado configurado: <strong>${esc(window.Store.CONFIG.affiliateTag)}</strong>. Cambia el valor de demostración en <code>js/main.js</code> por tu ID aprobado antes de publicar. Para un producto habilitado, usa su URL completa de una página de Amazon.</div>
    </div>`;
  }
  function productPanel(products) {
    const rows = products.length ? products.map(p => `<tr><td><div class="admin-product"><img src="${esc(p.image || 'https://placehold.co/80x80/e8e9dc/315f4b?text=AS')}" alt=""><span><strong>${esc(p.title)}</strong><small>${esc(p.category || 'Sin categoría')}${p.demo ? ' · ejemplo' : ''}</small></span></div></td><td>${p.price == null ? '—' : money(p.price)}</td><td><span class="status-pill ${p.active === false ? 'off' : ''}">${p.active === false ? 'Oculto' : 'Visible'}</span></td><td><div class="admin-row-actions"><button data-edit-product="${esc(p.id)}">Editar</button><button data-toggle-product="${esc(p.id)}">${p.active === false ? 'Mostrar' : 'Ocultar'}</button><button class="delete" data-delete-product="${esc(p.id)}">Eliminar</button></div></td></tr>`).join('') : `<tr><td colspan="4" class="admin-empty">Aún no hay productos. Agrega uno para empezar tu selección.</td></tr>`;
    return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>Catálogo de productos</h2><p class="admin-help">Mantén títulos claros, imágenes propias o autorizadas, y enlaces vigentes.</p></div><button class="admin-button primary" data-new-product>+ Añadir producto</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Producto</th><th>Precio de referencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function performancePanel(products) {
    const currentSales = sales.filter(r => inPeriod(r.date));
    const currentClicks = clicks.filter(r => inPeriod(r.date.slice(0, 10)));
    const orders = currentSales.reduce((s, r) => s + Number(r.orders || 0), 0);
    const units = currentSales.reduce((s, r) => s + Number(r.units || 0), 0);
    const rangeControl = period === 'month' ? `<input type="month" value="${anchorDate.slice(0, 7)}" data-anchor-month aria-label="Mes del reporte">` : period === 'year' ? `<input type="number" min="2000" max="2200" value="${anchorDate.slice(0, 4)}" data-anchor-year aria-label="Año del reporte">` : `<input type="date" value="${anchorDate}" data-anchor-day aria-label="Día del reporte">`;
    const productOptions = products.map(p => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');
    const records = [...currentSales].sort((a, b) => b.date.localeCompare(a.date)).map(r => `<tr><td>${esc(new Date(`${r.date}T12:00:00`).toLocaleDateString('es-EC'))}</td><td>${esc(products.find(p => p.id === r.productId)?.title || 'Producto eliminado')}</td><td>${Number(r.orders || 0)}</td><td>${Number(r.units || 0)}</td><td>${money(r.revenue)}</td><td>${money(r.commission)}</td><td><div class="admin-row-actions"><button data-edit-sale="${esc(r.id)}">Editar</button><button class="delete" data-delete-sale="${esc(r.id)}">Eliminar</button></div></td></tr>`).join('');
    return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>Resumen de rendimiento</h2><p class="admin-help">Periodo: <strong>${esc(periodLabel())}</strong> · ventas y comisiones se copian manualmente desde Amazon.</p></div><div class="period-switch"><button class="period-button" aria-pressed="${period === 'day'}" data-period="day">Día</button><button class="period-button" aria-pressed="${period === 'month'}" data-period="month">Mes</button><button class="period-button" aria-pressed="${period === 'year'}" data-period="year">Año</button></div></div>
      <div class="report-controls">${rangeControl}<span class="admin-help">Estos datos no se sincronizan con Amazon ni con otros dispositivos.</span></div>
      <div class="admin-metrics" style="margin-top:16px"><div class="metric-card"><span>Ventas atribuidas</span><strong>${money(moneySum(currentSales, 'revenue'))}</strong><small>copiadas manualmente</small></div><div class="metric-card"><span>Comisión</span><strong>${money(moneySum(currentSales, 'commission'))}</strong><small>copiada de Associates</small></div><div class="metric-card"><span>Pedidos · unidades</span><strong>${orders} · ${units}</strong><small>según tus registros</small></div><div class="metric-card"><span>Clics salientes locales</span><strong>${currentClicks.length}</strong><small>actividad de este navegador</small></div></div>
      <form class="sales-entry" data-sales-form><label>Fecha<input type="date" name="date" value="${esc(anchorDate)}" required></label><label>Producto<select name="productId" required>${productOptions || '<option value="">Añade un producto primero</option>'}</select></label><label>Pedidos<input type="number" name="orders" min="0" step="1" value="0" required></label><label>Unidades<input type="number" name="units" min="0" step="1" value="0" required></label><label>Ventas USD<input type="number" name="revenue" min="0" step="0.01" value="0.00" required></label><label>Comisión USD<input type="number" name="commission" min="0" step="0.01" value="0.00" required></label><button class="admin-button primary" type="submit">Guardar resultado</button></form>
      </section><section class="admin-panel"><div class="admin-panel-head"><div><h2>Registros del periodo</h2><p class="admin-help">Los clics locales no son compras confirmadas.</p></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Pedidos</th><th>Unidades</th><th>Ventas</th><th>Comisión</th><th>Acciones</th></tr></thead><tbody>${records || '<tr><td colspan="7" class="admin-empty">No hay resultados registrados en este periodo.</td></tr>'}</tbody></table></div></section>`;
  }
  function productDialog(product = {}) {
    editingProductId = product.id || null;
    dialog.innerHTML = `<div class="admin-dialog-inner"><div class="admin-dialog-title"><div><span class="eyebrow">CATÁLOGO</span><h2>${editingProductId ? 'Editar producto' : 'Añadir producto'}</h2></div><button class="dialog-close" type="button" data-close-admin-dialog aria-label="Cerrar">×</button></div>
    <form class="admin-form" data-product-form>
      <label class="full">Nombre del producto<input name="title" required maxlength="140" value="${esc(product.title || '')}" placeholder="Ej.: Organizador compacto para escritorio"></label>
      <label>Categoría<input name="category" required maxlength="40" value="${esc(product.category || '')}" placeholder="Hogar, tecnología…"></label>
      <label>URL del producto en Amazon<input name="amazonUrl" type="url" value="${esc(product.amazonUrl || '')}" placeholder="https://www.amazon.com/dp/…"></label>
      <label class="full">URL de la imagen<input name="image" type="url" value="${esc(product.image || '')}" placeholder="https://…"></label>
      <label>Precio de referencia (USD)<input name="price" type="number" min="0" step="0.01" value="${product.price ?? ''}" placeholder="Deja vacío para consultar en Amazon"></label>
      <label>Valoración comprobada<input name="rating" type="number" min="1" max="5" step="0.1" value="${product.rating ?? ''}" placeholder="Opcional, de 1 a 5"></label>
      <label class="full">Descripción breve<textarea name="description" maxlength="300" placeholder="Explica con honestidad para quién puede servir.">${esc(product.description || '')}</textarea></label>
      <label>Ventajas verificadas, separadas por comas<textarea name="pros">${esc((product.pros || []).join(', '))}</textarea></label>
      <label>Aspectos a considerar, separados por comas<textarea name="cons">${esc((product.cons || []).join(', '))}</textarea></label>
      <label>Etiquetas de búsqueda, separadas por comas<input name="tags" value="${esc((product.tags || []).join(', '))}"></label>
      <label>Insignia opcional<input name="badge" maxlength="24" value="${esc(product.badge || '')}" placeholder="Recomendado, Novedad…"></label>
      <div class="admin-form-actions"><button type="button" class="admin-button" data-close-admin-dialog>Cancelar</button><button type="submit" class="admin-button primary">Guardar producto</button></div>
      <p class="admin-help full">Usa un precio de referencia solo si lo mantendrás actualizado. Las opiniones deben ser propias, honestas y verificables. El enlace debe llevar a un dominio de Amazon.</p>
    </form></div>`;
    dialog.showModal();
  }
  function saleDialog(record) {
    editingSaleId = record.id; const products = window.Store.state.products;
    dialog.innerHTML = `<div class="admin-dialog-inner"><div class="admin-dialog-title"><h2>Editar resultado de Amazon</h2><button class="dialog-close" type="button" data-close-admin-dialog aria-label="Cerrar">×</button></div><form class="admin-form" data-edit-sale-form>
      <label>Fecha<input name="date" type="date" required value="${esc(record.date)}"></label><label>Producto<select name="productId">${products.map(p => `<option value="${esc(p.id)}" ${p.id === record.productId ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></label>
      <label>Pedidos<input name="orders" type="number" min="0" required value="${Number(record.orders || 0)}"></label><label>Unidades<input name="units" type="number" min="0" required value="${Number(record.units || 0)}"></label>
      <label>Ventas atribuidas USD<input name="revenue" type="number" min="0" step="0.01" required value="${Number(record.revenue || 0)}"></label><label>Comisión USD<input name="commission" type="number" min="0" step="0.01" required value="${Number(record.commission || 0)}"></label>
      <div class="admin-form-actions"><button type="button" class="admin-button" data-close-admin-dialog>Cancelar</button><button type="submit" class="admin-button primary">Guardar cambios</button></div></form></div>`; dialog.showModal();
  }
  function persistProducts(products) { window.Store.saveProducts(products); render(); }
  function readProduct(form) {
    const f = new FormData(form), title = String(f.get('title')).trim(), category = String(f.get('category')).trim(), url = String(f.get('amazonUrl')).trim(), image = String(f.get('image')).trim();
    if (!title || !category) throw new Error('Completa el nombre y la categoría.');
    if (url && !window.Store.validAmazonUrl(url)) throw new Error('El enlace debe ser HTTPS y pertenecer a un dominio de Amazon.');
    if (image && !/^https:\/\//i.test(image)) throw new Error('La imagen debe usar una dirección HTTPS.');
    const rawRating = String(f.get('rating')).trim(), rating = rawRating ? Number(rawRating) : null;
    const rawPrice = String(f.get('price')).trim(), price = rawPrice ? Number(rawPrice) : null;
    if (rating != null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) throw new Error('La valoración debe estar entre 1 y 5.');
    if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error('El precio debe ser un número válido.');
    const split = key => String(f.get(key) || '').split(',').map(s => s.trim()).filter(Boolean);
    return { title, category, amazonUrl: url, image, price, rating, description: String(f.get('description') || '').trim(), pros: split('pros'), cons: split('cons'), tags: split('tags'), badge: String(f.get('badge') || '').trim(), specs: {} };
  }
  function validateBackup(obj) {
    if (!obj || obj.app !== 'alin-store' || obj.version !== BACKUP_VERSION || !Array.isArray(obj.products) || !Array.isArray(obj.sales) || !Array.isArray(obj.clicks)) throw new Error('El archivo no es un respaldo válido de Alin Store.');
    const ids = new Set();
    for (const p of obj.products) { if (!p || typeof p.id !== 'string' || !p.id.trim() || ids.has(p.id) || typeof p.title !== 'string' || typeof p.category !== 'string' || (p.amazonUrl && !window.Store.validAmazonUrl(p.amazonUrl))) throw new Error('El respaldo contiene un producto inválido o un enlace no permitido.'); ids.add(p.id); }
    for (const r of obj.sales) { if (!r || typeof r.id !== 'string' || typeof r.productId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || ![r.orders, r.units, r.revenue, r.commission].every(n => Number.isFinite(Number(n)) && Number(n) >= 0)) throw new Error('El respaldo contiene un registro de ventas inválido.'); }
    for (const c of obj.clicks) { if (!c || typeof c.productId !== 'string' || Number.isNaN(Date.parse(c.date))) throw new Error('El respaldo contiene un registro de clics inválido.'); }
    return obj;
  }
  function exportBackup() { const data = { app: 'alin-store', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), products: window.Store.state.products, sales, clicks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `alin-store-respaldo-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Respaldo descargado. Guárdalo en un lugar seguro.'); }
  adminRoot.addEventListener('click', e => {
    const target = e.target.closest('button'); if (!target) return;
    if (target.matches('[data-admin-back]')) { hide(); return; }
    if (target.matches('[data-tab]')) { tab = target.dataset.tab; render(); return; }
    if (target.matches('[data-new-product]')) { productDialog(); return; }
    if (target.matches('[data-edit-product]')) { productDialog(window.Store.state.products.find(p => p.id === target.dataset.editProduct) || {}); return; }
    if (target.matches('[data-toggle-product]')) { const products = window.Store.state.products.map(p => p.id === target.dataset.toggleProduct ? { ...p, active: p.active === false } : p); persistProducts(products); return; }
    if (target.matches('[data-delete-product]')) { const p = window.Store.state.products.find(x => x.id === target.dataset.deleteProduct); if (p && confirm(`¿Eliminar “${p.title}” del catálogo? Los registros anteriores de ventas se conservarán.`)) persistProducts(window.Store.state.products.filter(x => x.id !== p.id)); return; }
    if (target.matches('[data-period]')) { period = target.dataset.period; render(); return; }
    if (target.matches('[data-edit-sale]')) { const r = sales.find(x => x.id === target.dataset.editSale); if (r) saleDialog(r); return; }
    if (target.matches('[data-delete-sale]')) { if (confirm('¿Eliminar este registro manual de Amazon?')) { sales = sales.filter(x => x.id !== target.dataset.deleteSale); saveSales(); render(); } return; }
    if (target.matches('[data-export]')) { exportBackup(); return; }
    if (target.matches('[data-import]')) { adminRoot.querySelector('[data-import-file]').click(); return; }
  });
  adminRoot.addEventListener('change', async e => {
    if (e.target.matches('[data-anchor-day]')) { anchorDate = e.target.value || today(); render(); }
    if (e.target.matches('[data-anchor-month]')) { anchorDate = `${e.target.value || today().slice(0, 7)}-01`; render(); }
    if (e.target.matches('[data-anchor-year]')) { const y = Math.min(2200, Math.max(2000, Number(e.target.value) || new Date().getFullYear())); anchorDate = `${y}-01-01`; render(); }
    if (e.target.matches('[data-import-file]') && e.target.files?.[0]) { try { const data = validateBackup(JSON.parse(await e.target.files[0].text())); window.Store.saveProducts(data.products); sales = data.sales; clicks = data.clicks; saveSales(); saveClicks(); toast('Respaldo restaurado correctamente.'); render(); } catch (err) { toast(err.message || 'No se pudo leer el respaldo.', true); } e.target.value = ''; }
  });
  adminRoot.addEventListener('submit', e => {
    if (e.target.matches('[data-sales-form]')) { e.preventDefault(); const f = new FormData(e.target); const record = { id: uid(), date: String(f.get('date')), productId: String(f.get('productId')), orders: Number(f.get('orders')), units: Number(f.get('units')), revenue: Number(f.get('revenue')), commission: Number(f.get('commission')) }; if (!record.productId || !record.date || Object.values(record).slice(3).some(n => !Number.isFinite(n) || n < 0)) { toast('Revisa los datos del resultado.', true); return; } sales.push(record); saveSales(); render(); toast('Resultado manual guardado.'); return; }
  });
  dialog.addEventListener('submit', e => {
    if (e.target.matches('[data-product-form]')) { e.preventDefault(); try { const fields = readProduct(e.target), old = window.Store.state.products.find(p => p.id === editingProductId); let id = editingProductId || fields.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid(); if (!old) { const base = id; let suffix = 2; while (window.Store.state.products.some(p => p.id === id)) id = `${base}-${suffix++}`; } const product = { ...old, ...fields, id, active: old?.active ?? true, demo: false }; const products = old ? window.Store.state.products.map(p => p.id === id ? product : p) : [...window.Store.state.products, product]; dialog.close(); persistProducts(products); toast(old ? 'Producto actualizado.' : 'Producto añadido.'); } catch (err) { toast(err.message, true); } return; }
    if (e.target.matches('[data-edit-sale-form]')) { e.preventDefault(); const f = new FormData(e.target); const id = editingSaleId; sales = sales.map(r => r.id === id ? { ...r, date: String(f.get('date')), productId: String(f.get('productId')), orders: Number(f.get('orders')), units: Number(f.get('units')), revenue: Number(f.get('revenue')), commission: Number(f.get('commission')) } : r); saveSales(); dialog.close(); render(); toast('Registro actualizado.'); }
  });
  dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-close-admin-dialog]')) dialog.close(); });
  window.addEventListener('alin:outbound-click', e => { clicks.push({ productId: e.detail.productId, date: e.detail.date }); saveClicks(); });
  window.AlInAdmin = { show, hide };
})();

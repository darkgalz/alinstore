// ===== CONFIGURACIÓN DEL ASISTENTE =====
// mode: 'local' (sin API key) | 'api' (OpenAI o Claude)
// ADVERTENCIA: una API key en JavaScript del navegador es visible para cualquiera.
// Para producción usa un proxy (Cloudflare Worker, etc.) y pon su URL en `proxyUrl`.
const AI_CONFIG = {
  mode: 'local',
  provider: 'claude',            // 'claude' | 'openai'
  apiKey: '',
  model: { claude: 'claude-haiku-5-5', openai: 'gpt-4o-mini' },
  proxyUrl: '',                  // opcional: tu endpoint que reenvía a la API
  maxResults: 3
};

(() => {
  const S = () => window.Store;
  const history = [];
  const STOP = new Set('un una unos unas el la los las de del para por con sin que y o a en busco quiero necesito algo mi mis me es regalo tipo cosa menos mas'.split(' '));
  const SYN = [
    ['gamer', 'gaming', 'videojuegos', 'juegos', 'consola', 'ps5', 'pc'],
    ['cocina', 'cocinar', 'chef', 'comida', 'freidora', 'hogar', 'gadget'],
    ['mochila', 'bolso', 'viaje', 'trabajo', 'estudiante', 'laptop'],
    ['audio', 'auriculares', 'sonido', 'musica'],
    ['saludable', 'dieta', 'fit']
  ];

  function parseBudget(t) {
    const m = t.match(/(?:menos de|bajo|maximo|máximo|hasta|under|below|max)\s*\$?\s*(\d+(?:[.,]\d+)?)/i) || t.match(/\$\s*(\d+(?:[.,]\d+)?)/);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }
  function tokens(t) {
    const base = S().norm(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    const out = new Set(base);
    base.forEach(w => SYN.forEach(g => { if (g.some(x => x.startsWith(w) || w.startsWith(x))) g.forEach(x => out.add(x)); }));
    return [...out];
  }
  function localRecommend(text) {
    const budget = parseBudget(text), toks = tokens(text), { norm } = S();
    const scored = S().state.products.map(p => {
      if (budget != null && p.price != null && p.price > budget) return { p, s: -1 };
      const tags = (p.tags || []).map(norm), title = norm(p.title), cat = norm(p.category), desc = norm(p.description);
      let s = 0;
      toks.forEach(t => {
        if (tags.some(x => x === t || x.includes(t))) s += 3;
        if (title.includes(t)) s += 2;
        if (cat.includes(t)) s += 2;
        if (desc.includes(t)) s += 1;
      });
      if (s > 0) s += p.rating / 5;
      return { p, s };
    }).filter(x => x.s >= 0);
    let best = scored.filter(x => x.s > 1).sort((a, b) => b.s - a.s).slice(0, AI_CONFIG.maxResults).map(x => x.p);
    const found = best.length > 0;
    if (!found) best = scored.sort((a, b) => b.p.rating - a.p.rating).slice(0, AI_CONFIG.maxResults).map(x => x.p);
    return { ids: best.map(p => p.id), message: !best.length ? 'No tengo productos dentro de ese presupuesto. ¿Subimos un poco el límite?'
      : found ? `Para lo que buscas${budget ? ` (hasta $${budget})` : ''}, estas son mis mejores opciones:`
      : 'No encontré coincidencias exactas, pero estos son los mejor valorados:' };
  }

  async function apiRecommend(text) {
    const catalog = S().state.products.map(p => ({ id: p.id, title: p.title, category: p.category, price: p.price, rating: p.rating, tags: p.tags, pros: p.pros }));
    const system = `Eres un experto en ventas amable y honesto de una tienda de afiliados de Amazon. Recomienda de 2 a 3 productos SOLO del catálogo, respetando presupuesto e intención. Responde ÚNICAMENTE JSON: {"message":"texto breve en español","ids":["id1","id2"]}.\nCatálogo: ${JSON.stringify(catalog)}`;
    const msgs = [...history.slice(-6), { role: 'user', content: text }];
    const k = AI_CONFIG.apiKey, claude = AI_CONFIG.provider === 'claude';
    const url = AI_CONFIG.proxyUrl || (claude ? 'https://api.anthropic.com/v1/messages' : 'https://api.openai.com/v1/chat/completions');
    const headers = { 'Content-Type': 'application/json' };
    let body;
    if (claude) {
      if (!AI_CONFIG.proxyUrl) Object.assign(headers, { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
      body = { model: AI_CONFIG.model.claude, max_tokens: 600, system, messages: msgs };
    } else {
      if (!AI_CONFIG.proxyUrl) headers.Authorization = 'Bearer ' + k;
      body = { model: AI_CONFIG.model.openai, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, ...msgs] };
    }
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('API ' + r.status);
    const j = await r.json();
    const raw = claude ? j.content.map(c => c.text || '').join('') : j.choices[0].message.content;
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    parsed.ids = (parsed.ids || []).filter(id => S().state.products.some(p => p.id === id)).slice(0, AI_CONFIG.maxResults);
    return parsed;
  }

  // ---- UI ----
  const root = document.createElement('div');
  root.innerHTML = `
    <button id="ai-fab" aria-expanded="false" aria-controls="ai-panel">💬 Asesor de compras</button>
    <section id="ai-panel" aria-label="Asistente de compras">
      <div class="px-4 py-3 bg-ink text-white font-semibold flex justify-between"><span>Asesor de compras</span><button id="ai-x" aria-label="Cerrar">&times;</button></div>
      <div id="ai-log" aria-live="polite"></div>
      <form id="ai-form" class="flex border-t border-ink/10"><label class="sr-only" for="ai-in">Mensaje</label>
        <input id="ai-in" class="flex-1 px-3 py-3 outline-none" placeholder="Ej: regalo para un gamer" autocomplete="off">
        <button class="px-4 font-bold text-teal">Enviar</button></form>
    </section>`;
  document.body.appendChild(root);
  const $$ = s => root.querySelector(s), log = $$('#ai-log'), panel = $$('#ai-panel');

  function say(html, who) {
    const d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = html;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function recCards(ids) {
    const { esc, affiliateUrl, priceText, state } = S();
    return ids.map(id => state.products.find(p => p.id === id && p.active !== false)).filter(Boolean).map(p => `
      <div class="rec"><img src="${esc(p.image)}" alt="" loading="lazy">
        <div><strong class="text-sm">${esc(p.title)}</strong><div class="text-xs my-1">${S().stars(p.rating)} · ${priceText(p)}</div>
        ${affiliateUrl(p.amazonUrl) ? `<a data-product-link data-product-id="${esc(p.id)}" href="${esc(affiliateUrl(p.amazonUrl))}" target="_blank" rel="sponsored nofollow noopener">Ver en Amazon</a>` : '<span class="text-xs">Enlace pendiente de configurar</span>'}
        <button data-id="${esc(p.id)}">Detalle</button></div></div>`).join('');
  }
  async function ask(text) {
    say(S().esc(text), 'user');
    const wait = say('Pensando…', 'bot');
    await S().ready;
    let res;
    if (AI_CONFIG.mode === 'api' && (AI_CONFIG.apiKey || AI_CONFIG.proxyUrl)) {
      try { res = await apiRecommend(text); } catch (e) { console.warn('Falló la API, uso modo local:', e); res = localRecommend(text); }
    } else res = localRecommend(text);
    wait.innerHTML = S().esc(res.message) + recCards(res.ids);
    history.push({ role: 'user', content: text }, { role: 'assistant', content: JSON.stringify(res) });
    log.scrollTop = log.scrollHeight;
  }

  const toggle = open => { panel.classList.toggle('open', open); $$('#ai-fab').setAttribute('aria-expanded', open); if (open) $$('#ai-in').focus(); };
  $$('#ai-fab').onclick = () => toggle(!panel.classList.contains('open'));
  $$('#ai-x').onclick = () => toggle(false);
  $$('#ai-form').onsubmit = e => { e.preventDefault(); const i = $$('#ai-in'), v = i.value.trim(); if (v) { i.value = ''; ask(v); } };
  log.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) S().openProduct(b.dataset.id); });
  say('¡Hola! Cuéntame qué buscas y tu presupuesto. Por ejemplo: <em>"gadget de cocina por menos de $50"</em>.', 'bot');
})();

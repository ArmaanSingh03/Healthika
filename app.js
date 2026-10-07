// UI layer. State is per-day in localStorage ('hk:YYYY-MM-DD'); guest-first, no account needed.
const $ = s => document.querySelector(s), H = HEALTHIKA_CONFIG, MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Other'];
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const fmt = (v, d = 1) => ok(v) ? (+v.toFixed(d)).toLocaleString('en-IN') : '–';
const num = v => { v = parseFloat(v); return ok(v) && v > 0 ? v : NaN; };
const uid = () => Date.now() + '' + Math.floor(Math.random() * 1e4);
const today = () => new Date().toLocaleDateString('en-CA');
const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
let S = Object.assign({ log: [], water: [], work: [] }, ls.get('hk:' + today(), {}));
const save = () => ls.set('hk:' + today(), S);
const food = id => FOODS.find(f => f.id === id);
const totals = () => {
  const t = Object.fromEntries(NUT.map(n => [n[0], 0]));
  S.log.forEach(e => { const n = calculateNutrition(food(e.f), e.g); if (n) NUT.forEach(([k]) => t[k] += n[k]); });
  return t;
};
const stat = (k, t) => { const n = NUT.find(x => x[0] === k); return `<div class=stat><span>${n[1]}</span><b>${fmt(t[k], k === 'kcal' ? 0 : 1)}</b><small>${n[2]}</small></div>`; };
const macros = t => `<div class="grid g4">${['kcal', 'protein', 'carbs', 'fat'].map(k => stat(k, t)).join('')}</div>`;
const fs = { q: '', cat: '', sel: null }, sp = { tab: 'protein', type: '', brand: '', veg: false, max: '', minp: '', sort: 'perg', sel: [], cmp: 0 };
let EXC = ls.get('hk:ex', []), pend = [];
const EX = { Chest: ['Bench Press', 'Incline Dumbbell Press', 'Push-up'], Back: ['Deadlift', 'Lat Pulldown', 'Barbell Row'], Shoulders: ['Overhead Press', 'Lateral Raise'], Biceps: ['Barbell Curl', 'Hammer Curl'], Triceps: ['Triceps Pushdown', 'Skull Crusher'], Legs: ['Squat', 'Leg Press', 'Lunge'], Core: ['Plank', 'Crunch', 'Hanging Leg Raise'] };

const V = {
  dash() {
    const t = totals(), w = S.water.reduce((a, b) => a + b, 0);
    return `<section class=hero><h1>${esc(H.tagline)}</h1><p class=mu>Track calories, macros, micronutrients, food intake, supplements and fitness — built with Indian diets in mind.</p>
<a class=btn href="#food" data-quick=1>Start Tracking</a> <a class="btn alt" href="#calc">Explore Nutrition</a></section>
<h2>Today</h2>${macros(t)}<div class="grid g2"><div class=card>Water<b class=big>${fmt(w / 1000, 2)} L</b></div><div class=card>Foods logged<b class=big>${S.log.length}</b></div></div>
<h2>Quick actions</h2><div class=chips><a class=btn href="#food" data-quick=1>+ Add Food</a><a class="btn alt" href="#calc">Calculate Calories</a><a class="btn alt" href="#supp">Compare Supplements</a><a class="btn alt" href="#water">Log Water</a><a class="btn alt" href="#work">Log Workout</a><a class="btn alt" href="#ai">Ask AI</a></div>`;
  },
  food() {
    return `<h1>Food Tracker</h1><h2>Today's Nutrition</h2>${macros(totals())}<details class=card open><summary>Fiber, sugar &amp; micronutrients</summary><div class="grid g4">${NUT.slice(4).map(n => stat(n[0], totals())).join('')}</div></details>
<h2>Add Food</h2><div class=card><input id=q type=search placeholder="Search food… (e.g. banana, milk)" aria-label="Search food" value="${esc(fs.q)}" style="width:100%">
<div class=chips>${CATS.map(c => `<button class="chip ${fs.cat === c ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div><div id=res></div><div id=det></div></div>${logHTML()}`;
  },
  calc() {
    return `<h1>Maintenance Calories</h1><form class="card form" id=cf onsubmit="return false"><label>Age<input name=age type=number min=15 max=100 step=any></label>
<label>Sex<select name=sex><option value=m>Male</option><option value=f>Female</option></select></label><label>Height (cm)<input name=h type=number step=any></label><label>Weight (kg)<input name=w type=number step=any></label>
<label>Activity<select name=act>${ACT.map(a => `<option value=${a[1]}>${a[0]} (×${a[1]})</option>`).join('')}</select></label></form><div id=cr></div>
<p class=mu>Method: Mifflin-St Jeor BMR × activity factor, the same approach used by common calculators such as Calculator.net (not affiliated). Estimate only.</p>`;
  },
  supp() {
    const pro = sp.tab === 'protein', src = pro ? PROTEIN : CREATINE;
    let L = src.map(p => ({ ...p, m: pro ? calculateProteinCost(p) : calculateCreatineCost(p) }));
    const best = Math.min(...L.map(p => p.m.perG).filter(ok));
    L.forEach(p => p.value = ok(p.m.perG) ? Math.round(best / p.m.perG * 100) : NaN);
    const tk = pro ? 'proteinType' : 'creatineType', types = [...new Set(src.map(p => p[tk]))], brands = [...new Set(src.map(p => p.brand))];
    const mx = parseFloat(sp.max), mp = parseFloat(sp.minp);
    L = L.filter(p => (!sp.type || p[tk] === sp.type) && (!sp.brand || p.brand === sp.brand) && (!sp.veg || p.vegetarian !== false) && (!(mx > 0) || p.price <= mx) && (!(mp > 0) || !pro || p.protein >= mp));
    const SORT = { price: p => p.price, perg: p => p.m.perG, p100: p => -p.m.pct, ps: p => -p.protein, kcal: p => p.calories, serv: p => -p.servings, rating: p => -p.rating };
    L.sort((a, b) => SORT[sp.sort](a) - SORT[sp.sort](b) || 0);
    const sOpts = pro ? [['perg', 'Lowest ₹/g protein'], ['price', 'Lowest price'], ['p100', 'Highest protein/100g'], ['ps', 'Highest protein/serving'], ['kcal', 'Lowest calories'], ['serv', 'Most servings'], ['rating', 'Rating']] : [['perg', 'Lowest ₹/g creatine'], ['price', 'Lowest price'], ['serv', 'Most servings'], ['rating', 'Rating']];
    const C = pro ? [['Brand', p => esc(p.brand)], ['Product', p => esc(p.productName)], ['Type', p => p.proteinType], ['Flavour', p => esc(p.flavor)], ['Pack (g)', p => p.packSize], ['Price ₹', p => fmt(p.price, 0)], ['₹/100g', p => fmt(p.m.per100, 0)], ['Serving (g)', p => p.servingSize], ['Servings', p => p.servings], ['kcal/serv', p => p.calories], ['Protein/serv (g)', p => p.protein], ['Protein/100g', p => fmt(p.m.pct)], ['Carbs', p => p.carbs], ['Fat', p => p.fat], ['Sugar', p => p.sugar], ['BCAA', p => p.bcaa], ['Leucine', p => p.leucine], ['Ingredients', p => esc(p.ingredients)], ['Sweetener', p => esc(p.sweetener)], ['Vegetarian', p => p.vegetarian ? 'Yes' : 'No'], ['Testing', p => esc(p.certification)], ['Rating', p => p.rating], ['₹/g protein', p => '₹' + fmt(p.m.perG, 2)], ['Value score', p => fmt(p.value, 0)]]
      : [['Brand', p => esc(p.brand)], ['Product', p => esc(p.productName)], ['Type', p => p.creatineType], ['Pack (g)', p => p.packSize], ['Price ₹', p => fmt(p.price, 0)], ['Serving (g)', p => p.servingSize], ['Creatine/serv (g)', p => p.creatine], ['Servings', p => p.servings], ['Total creatine (g)', p => fmt(p.m.total, 0)], ['₹/serving', p => fmt(p.m.perServing, 1)], ['₹/g creatine', p => '₹' + fmt(p.m.perG, 2)], ['Flavour', p => esc(p.flavor)], ['Ingredients', p => esc(p.ingredients)], ['Purity/testing', p => esc(p.certification)], ['Rating', p => p.rating], ['Value score', p => fmt(p.value, 0)]];
    const sel = L.filter(p => sp.sel.includes(p.id)), tabs = ['protein', 'creatine'].map(t => `<button class="chip ${sp.tab === t ? 'on' : ''}" data-act=tab data-v=${t}>${t[0].toUpperCase() + t.slice(1)}</button>`).join('');
    const opt = (a, v) => a.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('');
    const filters = `<div class="card form"><label>Type<select data-sp=type><option value="">All</option>${opt(types, sp.type)}</select></label><label>Brand<select data-sp=brand><option value="">All</option>${opt(brands, sp.brand)}</select></label>
<label>Max price ₹<input data-sp=max type=number min=0 value="${esc(sp.max)}"></label>${pro ? `<label>Min protein/serving (g)<input data-sp=minp type=number min=0 value="${esc(sp.minp)}"></label>` : ''}
<label>Sort<select data-sp=sort>${sOpts.map(o => `<option value=${o[0]} ${sp.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>${pro ? `<label><span><input data-sp=veg type=checkbox ${sp.veg ? 'checked' : ''}> Vegetarian only</span></label>` : ''}</div>`;
    const cmp = sp.cmp && sel.length >= 2 ? `<h2>Side-by-side</h2><div class=tw><table><tbody>${C.map(c => `<tr><th>${c[0]}</th>${sel.map(p => `<td>${c[1](p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : sp.cmp ? '<p class=mu>Select 2–4 products to compare.</p>' : '';
    return `<h1>Supplement Comparison</h1><div class=chips>${tabs}</div><p class=mu>⚠ Demo data: fictional brands and prices for development. Replace with real entries via the admin/API.</p>${filters}
<div class=chips><button class=btn data-act=cmp>${sp.cmp ? 'Hide' : 'Compare'} selected (${sp.sel.length}/4)</button></div>${cmp}
<div class=tw><table><thead><tr><th>Pick</th>${C.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${L.map(p => `<tr><td><input type=checkbox data-pick=${p.id} aria-label="Select ${esc(p.productName)}" ${sp.sel.includes(p.id) ? 'checked' : ''}></td>${C.map(c => `<td>${c[1](p)}</td>`).join('')}</tr>`).join('') || '<tr><td>No products match.</td></tr>'}</tbody></table></div>
<p class=mu>${pro ? '₹/g protein = price ÷ (servings × protein per serving).' : '₹/g creatine = price ÷ (servings × creatine per serving).'} Value score = 100 × best ₹/g ÷ this product's ₹/g.</p>`;
  },
  water() {
    const w = S.water.reduce((a, b) => a + b, 0);
    return `<h1>Water</h1><div class=card><span class=mu>Today's Water</span><b class=big>${fmt(w / 1000, 2)} L</b><div class=bar role=img aria-label="${fmt(w / 1000, 2)} litres"><i style="width:${Math.min(100, w / 40)}%"></i></div><small>Scale 0–4 L, not a goal.</small></div>
<div class=chips>${[250, 500, 750, 1000].map(m => `<button class=btn data-act=water data-ml=${m}>+${m >= 1000 ? '1 L' : m + ' ml'}</button>`).join('')}<input id=wc type=number min=0 placeholder="Custom ml" aria-label="Custom ml"><button data-act=wcustom>Add</button><button data-act=undo>Undo last</button></div><p id=msg class=mu></p>`;
  },
  work() {
    const all = Object.entries(EX).map(([g, l]) => `<optgroup label="${g}">${l.map(e => `<option>${e}</option>`).join('')}</optgroup>`).join('') + (EXC.length ? `<optgroup label="Custom">${EXC.map(e => `<option>${esc(e)}</option>`).join('')}</optgroup>` : '');
    const by = {}; S.work.forEach(s => (by[s.ex] = by[s.ex] || []).push(s));
    return `<h1>Workouts</h1><div class="card form"><label>Exercise<select id=wx>${all}</select></label><label>Weight (kg)<input id=ww type=number min=0 step=any></label><label>Reps<input id=wr type=number min=0></label><label>Duration (min)<input id=wd type=number min=0 step=any></label><label>Notes<input id=wn></label><button class=btn data-act=addset>Add set</button></div>
<div class=form><input id=cx placeholder="New custom exercise" aria-label="Custom exercise"><button data-act=addex>Add exercise</button></div><p id=msg class=mu></p>
${Object.entries(by).map(([ex, ss]) => `<div class=card><h3>${esc(ex)}</h3>${ss.map((s, i) => `<div class=row2><span>Set ${i + 1} — ${s.w ? s.w + ' kg × ' : ''}${s.r ? s.r + ' reps' : ''}${s.d ? ' ' + s.d + ' min' : ''} <small>${esc(s.n || '')}</small></span><button data-act=delset data-i=${s.i}>Delete</button></div>`).join('')}</div>`).join('') || '<p class=mu>No sets logged today.</p>'}`;
  },
  ai() {
    return `<h1>AI Assistant</h1><div class=card><p><b>${H.aiEndpoint ? 'AI connected' : 'Demo mode'}</b> — ${H.aiEndpoint ? 'replies come from your configured API.' : 'no AI API configured (set <code>aiEndpoint</code> in config.js). Below is a simple rule-based food parser, <b>not AI</b>.'}</p>
<textarea id=at rows=3 style="width:100%" aria-label="Describe what you ate" placeholder="I ate 2 rotis, one bowl rajma and 500ml milk"></textarea><button class=btn data-act=ask>Send</button></div><div id=ao></div>`;
  },
  set() {
    return `<h1>Settings &amp; Data</h1><div class=card><h3>Data management</h3><p class=mu>Data is stored only in this browser (localStorage).</p><div class=chips><button class=btn data-act=export>Export My Data (JSON)</button><button data-act=reset>Reset today's data</button></div></div>
<div class=card><h3>Privacy</h3><p>No account or personal information is required. Nothing leaves your device unless you configure an AI endpoint.</p><p class=mu>${esc(H.disclaimer)}</p></div>`;
  }
};

function logHTML() {
  return `<h2>Today's Food</h2>` + MEALS.map(m => {
    const es = S.log.filter(e => e.m === m);
    return `<div class=card><h3>${m}</h3>${es.map(e => { const f = food(e.f), n = f && calculateNutrition(f, e.g); if (!n) return ''; return `<div class=row2><span>${esc(f.name)} — ${esc(e.l)} <small>${fmt(n.kcal, 0)} kcal · ${fmt(n.protein)} g protein</small></span><span><button data-act=edit data-i=${e.i}>Edit</button><button data-act=dup data-i=${e.i}>Duplicate</button><button data-act=del data-i=${e.i}>Delete</button></span></div>`; }).join('') || '<p class=mu>Nothing logged.</p>'}</div>`;
  }).join('');
}
const drawRes = () => {
  const q = fs.q.trim().toLowerCase(), r = FOODS.filter(f => (!fs.cat || f.cat === fs.cat) && (!q || (f.name + ' ' + f.alias).toLowerCase().includes(q)));
  $('#res').innerHTML = q || fs.cat ? (r.length ? r.slice(0, 30).map(f => `<button class=row data-sel="${f.id}"><span>${f.name}</span><small>${fmt(f.n.kcal, 0)} kcal / 100${f.unit}</small></button>`).join('') : '<p class=mu>No matching food. Try another name or category.</p>') : '<p class=mu>Search above or pick a category.</p>';
};
const gramsOf = () => {
  const f = food(fs.sel), v = $('#sv').value;
  return v === 'c' ? num($('#ca').value) * ({ g: 1, kg: 1000, ml: 1, l: 1000 }[$('#cu').value]) : num($('#qty').value) * f.s[v][1];
};
const prev = () => {
  const g = gramsOf(), p = $('#pv'), f = food(fs.sel);
  if (!(g > 0)) { p.textContent = 'Enter a valid amount greater than 0.'; return NaN; }
  if (g > H.maxGrams) { p.textContent = 'That amount looks too large. Please check it.'; return NaN; }
  const n = calculateNutrition(f, g);
  p.innerHTML = `<b>${fmt(g, 0)} ${f.unit}</b> — ${['kcal', 'protein', 'carbs', 'fat'].map(k => `${NUT.find(x => x[0] === k)[1]}: ${fmt(n[k], k === 'kcal' ? 0 : 1)}`).join(' · ')}`;
  return g;
};
const drawDet = () => {
  const f = food(fs.sel), d = $('#det'); if (!f) { d.innerHTML = ''; return; }
  d.innerHTML = `<h3>${f.name}</h3><p class=mu>Per 100 ${f.unit}: ${['kcal', 'protein', 'carbs', 'fat', 'fiber'].map(k => { const n = NUT.find(x => x[0] === k); return n[1] + ' ' + f.n[k] + ' ' + n[2]; }).join(' · ')}<br>Source: ${f.meta.source} (${f.meta.status})</p>
<div class=form><label>Serving<select id=sv>${f.s.map((s, i) => `<option value=${i}>${s[0]}</option>`).join('')}<option value=c>Custom</option></select></label><label id=qw>Quantity<input id=qty type=number min=0 step=any value=1></label>
<span id=cw class=form hidden><label>Amount<input id=ca type=number min=0 step=any value=100></label><label>Unit<select id=cu>${['g', 'kg', 'ml', 'l'].map(u => `<option>${u}</option>`).join('')}</select></label></span>
<label>Meal<select id=ml>${MEALS.map(m => `<option>${m}</option>`).join('')}</select></label></div><div id=pv class=card></div><button class=btn id=add>Add to Today</button><p class=mu>${esc(H.estimateNote)}</p>`;
  $('#sv').onchange = () => { const c = $('#sv').value === 'c'; $('#cw').hidden = !c; $('#qw').hidden = c; prev(); };
  d.querySelectorAll('input').forEach(i => i.oninput = prev); $('#cu').onchange = prev; prev();
  $('#add').onclick = () => {
    const g = prev(); if (!(g > 0)) return; const v = $('#sv').value;
    S.log.push({ i: uid(), f: f.id, g, l: v === 'c' ? `${$('#ca').value} ${$('#cu').value}` : `${$('#qty').value} × ${f.s[v][0]}`, m: $('#ml').value });
    save(); fs.sel = null; render();
  };
};
const init = {
  food() { const q = $('#q'); q.oninput = () => { fs.q = q.value; drawRes(); }; drawRes(); drawDet(); if (fs.focus) { q.focus(); fs.focus = 0; } },
  calc() {
    const f = $('#cf'), run = () => {
      const age = parseFloat(f.age.value), h = parseFloat(f.h.value), w = parseFloat(f.w.value), sx = f.sex.value, fa = parseFloat(f.act.value), o = $('#cr');
      if (!(age >= 15 && age <= 100 && h >= 100 && h <= 250 && w >= 25 && w <= 300)) { o.innerHTML = '<p class=mu>Enter age (15–100), height (100–250 cm) and weight (25–300 kg).</p>'; return; }
      const b = calculateBMR(sx, w, h, age), t = calculateTDEE(b, fa);
      o.innerHTML = `<div class="grid g4"><div class=stat><span>BMR</span><b>${fmt(b, 0)}</b><small>kcal/day</small></div><div class=stat><span>Maintenance (TDEE)</span><b>${fmt(t, 0)}</b><small>kcal/day</small></div><div class=stat><span>Activity factor</span><b>×${fa}</b></div></div>
<div class=card><h3>Formula (Mifflin-St Jeor)</h3><p>BMR = 10 × weight + 6.25 × height − 5 × age ${sx === 'm' ? '+ 5' : '− 161'}<br>= 10 × ${w} + 6.25 × ${h} − 5 × ${age} ${sx === 'm' ? '+ 5' : '− 161'} = <b>${fmt(b, 0)}</b><br>TDEE = BMR × ${fa} = <b>${fmt(t, 0)} kcal</b></p></div>`;
    };
    f.oninput = f.onchange = run; run();
  }
};
const acts = {
  edit(d) { const e = S.log.find(x => x.i === d.i), f = food(e.f), v = num(prompt(`New amount in ${f.unit} (now ${fmt(e.g, 0)})`)); if (v > 0 && v <= H.maxGrams) { e.g = v; e.l = `${v} ${f.unit}`; save(); render(); } else alert('Please enter a valid amount.'); },
  dup(d) { const e = S.log.find(x => x.i === d.i); S.log.push({ ...e, i: uid() }); save(); render(); },
  del(d) { S.log = S.log.filter(x => x.i !== d.i); save(); render(); },
  water(d) { S.water.push(+d.ml); save(); render(); },
  wcustom() { const v = num($('#wc').value); if (v > 0 && v <= 5000) { S.water.push(v); save(); render(); } else $('#msg').textContent = 'Enter an amount between 1 and 5000 ml.'; },
  undo() { S.water.pop(); save(); render(); },
  tab(d) { Object.assign(sp, { tab: d.v, sel: [], type: '', brand: '', cmp: 0, sort: 'perg' }); render(); },
  cmp() { sp.cmp = !sp.cmp; render(); },
  addex() { const v = $('#cx').value.trim(); if (!v) { $('#msg').textContent = 'Enter an exercise name.'; return; } if (!EXC.includes(v)) EXC.push(v); ls.set('hk:ex', EXC); render(); },
  addset() {
    const w = parseFloat($('#ww').value) || 0, r = parseInt($('#wr').value) || 0, d = parseFloat($('#wd').value) || 0;
    if (w < 0 || r < 0 || d < 0 || w > 1000 || !(r || d)) { $('#msg').textContent = 'Enter reps and/or duration (no negative values).'; return; }
    S.work.push({ i: uid(), ex: $('#wx').value, w, r, d, n: $('#wn').value }); save(); render();
  },
  delset(d) { S.work = S.work.filter(x => x.i !== d.i); save(); render(); },
  async ask() {
    const t = $('#at').value.trim(), o = $('#ao'); if (!t) { o.innerHTML = '<p class=mu>Type what you ate first.</p>'; return; }
    if (H.aiEndpoint) {
      try { const r = await fetch(H.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: t, totals: totals() }) }); o.innerHTML = `<div class=card></div>`; o.firstChild.textContent = (await r.json()).reply; } catch { o.innerHTML = '<p class=mu>Could not reach the AI endpoint.</p>'; }
      return;
    }
    let s = t.toLowerCase().replace(/\b(one|two|three|four|five)\b/g, w => ({ one: 1, two: 2, three: 3, four: 4, five: 5 }[w]));
    pend = [];
    FOODS.forEach(f => { const m = s.match(new RegExp('(?:(\\d+(?:\\.\\d+)?)\\s*(ml|g)?\\s*(?:of\\s+)?(?:\\w+\\s+)?)?(?:' + f.alias + ')')); if (!m) return; const q = parseFloat(m[1]) || 1, g = m[2] ? q : q * f.s[0][1]; if (g > 0 && g <= H.maxGrams) pend.push({ i: uid(), f: f.id, g, l: m[2] ? `${q} ${m[2]}` : `${q} × ${f.s[0][0]}`, m: 'Other' }); });
    o.innerHTML = pend.length ? `<div class=card><h3>Detected (demo parser — check amounts)</h3>${pend.map(e => `<div class=row2>${esc(food(e.f).name)} — ${esc(e.l)}</div>`).join('')}<button class=btn data-act=addall>Add all to Today (Other)</button></div>` : '<p class=mu>Nothing recognised. Try e.g. "2 rotis, 1 bowl rajma, 500ml milk".</p>';
  },
  addall() { S.log.push(...pend); pend = []; save(); location.hash = 'food'; },
  export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('hk:')).map(k => [k, ls.get(k)])), null, 2)], { type: 'application/json' })); a.download = 'healthika-export.json'; a.click(); },
  reset() { if (confirm("Delete all of today's food, water and workout entries?")) { S = { log: [], water: [], work: [] }; save(); render(); } }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cat],[data-sel],[data-act],[data-quick]'); if (!b) return; const d = b.dataset;
  if (d.quick) { fs.focus = 1; if (location.hash === '#food') render(); }
  if (d.cat !== undefined) { fs.cat = fs.cat === d.cat ? '' : d.cat; render(); }
  if (d.sel) { fs.sel = d.sel; drawDet(); $('#det').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (d.act) acts[d.act](d);
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.sp;
  if (k) { sp[k] = t.type === 'checkbox' ? t.checked : t.value; render(); }
  if (t.dataset.pick) { const i = sp.sel.indexOf(t.dataset.pick); if (i > -1) sp.sel.splice(i, 1); else if (sp.sel.length < 4) sp.sel.push(t.dataset.pick); render(); }
});
const NAV = [['dash', 'Dashboard'], ['food', 'Food'], ['calc', 'Calories'], ['supp', 'Supplements'], ['work', 'Workouts'], ['water', 'Water'], ['ai', 'AI'], ['set', 'Settings']];
function render() {
  const r = V[location.hash.slice(1)] ? location.hash.slice(1) : 'dash';
  $('#nav').innerHTML = `<b>${esc(H.brandName)}</b>` + NAV.map(n => `<a href="#${n[0]}" ${n[0] === r ? 'aria-current=page' : ''}>${n[1]}</a>`).join('');
  $('#app').innerHTML = V[r](); (init[r] || (() => { }))();
}
document.title = H.brandName + ' — ' + H.tagline;
document.documentElement.style.setProperty('--a', H.primaryColor);
$('#disc').textContent = H.disclaimer;
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
render();

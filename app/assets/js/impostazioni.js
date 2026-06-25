(async function () {
  let data = await loadData();
  renderLayout('Impostazioni', data);

  // ---------- tabs ----------
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  function activateTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    contents.forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    activateTab(t.dataset.tab);
    history.replaceState(null, '', '#' + t.dataset.tab);
  }));
  const initialTab = location.hash ? location.hash.slice(1) : 'profilo';
  activateTab(['profilo','orari','servizi','staff','postazioni','coupon','dati'].includes(initialTab) ? initialTab : 'profilo');

  // ---------- profilo ----------
  const p = data.profile;
  document.getElementById('pName').value = p.business_name;
  document.getElementById('pType').value = p.type;
  document.getElementById('pEmail').value = p.email || '';
  document.getElementById('pPhone').value = p.phone || '';
  document.getElementById('pAddress').value = p.address || '';
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pBookingMode').value = p.booking_mode || 'manual';
  document.getElementById('pNotifyEmails').value = p.notification_emails || '';

  // ---------- funzionalità visibili ----------
  // checkbox -> { key: nome funzionalità salvato in hidden_features, types: tipi di attività per cui ha senso (vuoto = tutti) }
  const FEATURES = {
    featTables: { key: 'tables', types: ['restaurant'], row: 'rowTables' },
    featEvents: { key: 'events', types: ['restaurant'], row: 'rowEvents' },
    featStaff: { key: 'staff', types: [], row: 'rowStaff' },
    featCoupons: { key: 'coupons', types: [], row: 'rowCoupons' },
    featCommunications: { key: 'communications', types: [], row: 'rowCommunications' },
    featCustomersRegistry: { key: 'customers_registry', types: [], row: 'rowCustomersRegistry' },
  };
  const hiddenFeatures = p.hidden_features || [];
  Object.entries(FEATURES).forEach(([id, f]) => {
    document.getElementById(id).checked = !hiddenFeatures.includes(f.key);
  });

  const hiddenFields = p.hidden_fields || [];
  document.getElementById('featShowBirthDate').checked = !hiddenFields.includes('birth_date');
  document.getElementById('featShowFiscalCode').checked = !hiddenFields.includes('fiscal_code');

  function updateFeatureRowsVisibility() {
    const type = document.getElementById('pType').value;
    Object.entries(FEATURES).forEach(([id, f]) => {
      document.getElementById(f.row).style.display = (f.types.length === 0 || f.types.includes(type)) ? '' : 'none';
    });
  }
  function updateRegistryFieldsVisibility() {
    document.getElementById('registryFieldsRow').style.display = document.getElementById('featCustomersRegistry').checked ? '' : 'none';
  }
  updateFeatureRowsVisibility();
  updateRegistryFieldsVisibility();
  document.getElementById('pType').addEventListener('change', () => {
    updateFeatureRowsVisibility();
    updateTabsVisibility();
  });
  document.getElementById('featCustomersRegistry').addEventListener('change', updateRegistryFieldsVisibility);

  // tab di Impostazioni legate a una funzionalità disattivabile: si nascondono insieme alla relativa voce di menu
  const TAB_FEATURES = {
    tabBtnStaff: { feature: 'staff', types: [] },
    tabBtnPostazioni: { feature: 'tables', types: ['restaurant'] },
    tabBtnCoupon: { feature: 'coupons', types: [] },
  };
  function updateTabsVisibility() {
    const hidden = p.hidden_features || [];
    const type = document.getElementById('pType').value;
    let activeHidden = false;
    Object.entries(TAB_FEATURES).forEach(([btnId, cfg]) => {
      const btn = document.getElementById(btnId);
      const visible = !hidden.includes(cfg.feature) && (cfg.types.length === 0 || cfg.types.includes(type));
      btn.style.display = visible ? '' : 'none';
      if (!visible && btn.classList.contains('active')) activeHidden = true;
    });
    if (activeHidden) activateTab('profilo');
  }
  updateTabsVisibility();

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('pEmail').value.trim();
    const notifyEmails = document.getElementById('pNotifyEmails').value.trim();

    if (email && !EMAIL_RE.test(email)) {
      showToast('Email non valida', 'error');
      return;
    }
    if (notifyEmails) {
      const invalid = notifyEmails.split(',').map(s => s.trim()).filter(Boolean).filter(e => !EMAIL_RE.test(e));
      if (invalid.length > 0) {
        showToast(`Email notifiche non valida: ${invalid[0]}`, 'error');
        return;
      }
    }

    p.business_name = document.getElementById('pName').value.trim();
    p.type = document.getElementById('pType').value;
    p.email = email;
    p.phone = document.getElementById('pPhone').value.trim();
    p.address = document.getElementById('pAddress').value.trim();
    p.description = document.getElementById('pDescription').value.trim();
    p.booking_mode = document.getElementById('pBookingMode').value;
    p.notification_emails = notifyEmails;

    const hidden = [];
    Object.entries(FEATURES).forEach(([id, f]) => {
      if (!document.getElementById(id).checked) hidden.push(f.key);
    });
    p.hidden_features = hidden;

    const hiddenFieldsNow = [];
    if (!document.getElementById('featShowBirthDate').checked) hiddenFieldsNow.push('birth_date');
    if (!document.getElementById('featShowFiscalCode').checked) hiddenFieldsNow.push('fiscal_code');
    p.hidden_fields = hiddenFieldsNow;

    saveData(data);
    updateTabsVisibility();

    if (window.reservoAuth && window.reservoAuth.auth.currentUser) {
      window.reservoAuth.upsertBusinessDirectory(window.reservoAuth.getBusinessUid(), {
        business_name: p.business_name,
        type: p.type,
        slug: p.slug || slugify(p.business_name),
        description: p.description,
        address: p.address,
        phone: p.phone,
        email: p.email,
      }).catch(() => {});
    }

    showToast('Profilo salvato', 'success');
  });

  // ---------- orari ----------
  function renderHours() {
    const body = document.getElementById('hoursBody');
    body.innerHTML = data.hours.map((h, i) => `
      <tr>
        <td>${DAYS[h.day]}</td>
        <td><input type="time" data-hour-open="${i}" value="${h.open}" ${h.closed ? 'disabled' : ''}></td>
        <td><input type="time" data-hour-close="${i}" value="${h.close}" ${h.closed ? 'disabled' : ''}></td>
        <td><input type="checkbox" data-hour-closed="${i}" ${h.closed ? 'checked' : ''} style="width:auto"></td>
      </tr>`).join('');

    body.querySelectorAll('[data-hour-closed]').forEach(chk => chk.addEventListener('change', () => {
      const i = parseInt(chk.dataset.hourClosed, 10);
      data.hours[i].closed = chk.checked;
      renderHours();
    }));
  }
  renderHours();

  document.getElementById('saveHoursBtn').addEventListener('click', () => {
    document.querySelectorAll('[data-hour-open]').forEach(inp => {
      data.hours[parseInt(inp.dataset.hourOpen, 10)].open = inp.value;
    });
    document.querySelectorAll('[data-hour-close]').forEach(inp => {
      data.hours[parseInt(inp.dataset.hourClose, 10)].close = inp.value;
    });
    saveData(data);
    showToast('Orari salvati', 'success');
  });

  // ---------- chiusure straordinarie ----------
  function renderClosures() {
    const list = document.getElementById('closuresList');
    const closures = (data.closures || []).slice().sort((a,b) => a.date.localeCompare(b.date));
    if (closures.length === 0) {
      list.innerHTML = `<p class="text-mid small">Nessuna chiusura straordinaria programmata.</p>`;
      return;
    }
    list.innerHTML = closures.map(c => `
      <div class="flex justify-between items-center" style="padding:.4rem 0; border-bottom:1px solid var(--border)">
        <div><strong>${fmtDateLong(c.date)}</strong>${c.reason ? ' — ' + c.reason : ''}</div>
        <button class="btn btn-danger btn-sm" data-remove-closure="${c.id}">Rimuovi</button>
      </div>`).join('');
    list.querySelectorAll('[data-remove-closure]').forEach(btn => btn.addEventListener('click', () => {
      data.closures = data.closures.filter(c => c.id !== btn.dataset.removeClosure);
      saveData(data);
      renderClosures();
    }));
  }
  renderClosures();

  document.getElementById('closureForm').addEventListener('submit', (e) => {
    e.preventDefault();
    data.closures = data.closures || [];
    data.closures.push({ id: uid(), date: document.getElementById('cDate').value, reason: document.getElementById('cReason').value.trim() });
    saveData(data);
    document.getElementById('closureForm').reset();
    renderClosures();
    showToast('Chiusura aggiunta', 'success');
  });

  // ---------- generic editable list (servizi / staff / postazioni) ----------
  function setupEditableList(opts) {
    const { body, items, fields, addBtn, defaultItem } = opts;
    function render() {
      body.innerHTML = items.map((item, i) => `
        <tr>
          ${fields.map(f => {
            if (f.type === 'select') {
              const current = String(item[f.key] ?? '');
              return `<td><select data-field="${f.key}" data-i="${i}" style="min-width:120px">${f.options().map(o =>
                `<option value="${o.value}" ${String(o.value) === current ? 'selected' : ''}>${o.label}</option>`).join('')}</select></td>`;
            }
            if (f.type === 'checkboxes') {
              const selected = Array.isArray(item[f.key]) ? item[f.key] : [];
              const opts = f.options();
              if (opts.length === 0) return `<td><span class="small text-mid">Nessuno staff configurato</span></td>`;
              return `<td>${opts.map(o =>
                `<label style="display:inline-flex; align-items:center; gap:.25rem; margin:0 .6rem .2rem 0; font-size:.8rem; white-space:nowrap">
                  <input type="checkbox" data-field="${f.key}" data-i="${i}" data-value="${o.value}" ${selected.includes(o.value) ? 'checked' : ''}> ${o.label}
                </label>`).join('')}</td>`;
            }
            return `<td><input type="${f.type}" data-field="${f.key}" data-i="${i}" value="${item[f.key] ?? ''}" ${f.type==='number'?'min="0"':''} style="min-width:80px"></td>`;
          }).join('')}
          <td><button class="btn btn-danger btn-sm" data-remove="${i}">Rimuovi</button></td>
        </tr>`).join('');

      body.querySelectorAll('[data-field]').forEach(inp => inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.i, 10);
        const field = fields.find(f => f.key === inp.dataset.field);
        if (field.type === 'checkboxes') {
          items[i][field.key] = Array.from(
            body.querySelectorAll(`[data-field="${field.key}"][data-i="${i}"]:checked`)
          ).map(c => c.dataset.value);
        } else {
          items[i][field.key] = field.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value;
        }
        saveData(data);
        showToast('Salvato', 'success');
      }));
      body.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
        items.splice(parseInt(btn.dataset.remove, 10), 1);
        saveData(data);
        render();
        showToast('Rimosso');
      }));
    }
    addBtn.addEventListener('click', () => {
      items.push({ id: uid(), ...defaultItem });
      saveData(data);
      render();
    });
    render();
  }

  setupEditableList({
    body: document.getElementById('servicesBody'),
    items: data.services,
    fields: [
      { key: 'name', type: 'text' },
      { key: 'duration', type: 'number' },
      { key: 'price', type: 'number' },
      {
        key: 'staff_ids',
        type: 'checkboxes',
        // Visibile solo qui (lato attività): il sito pubblico non mostra mai
        // a chi è assegnato un servizio, lo usa solo per calcolare gli orari
        // disponibili (vedi prenotazioni.js/sito.js). Nessuna spunta = "chiunque
        // in staff", una o più spunte = solo quelle persone sanno fare il servizio.
        options: () => data.staff.map(s => ({ value: s.id, label: s.name })),
      },
    ],
    addBtn: document.getElementById('addServiceBtn'),
    defaultItem: { name: 'Nuovo servizio', duration: 30, price: 0, staff_ids: [] },
  });

  setupEditableList({
    body: document.getElementById('staffBody'),
    items: data.staff,
    fields: [
      { key: 'name', type: 'text' },
      { key: 'role', type: 'text' },
    ],
    addBtn: document.getElementById('addStaffBtn'),
    defaultItem: { name: 'Nuova persona', role: 'Staff' },
  });

  setupEditableList({
    body: document.getElementById('tablesBody'),
    items: data.tables,
    fields: [
      { key: 'name', type: 'text' },
      { key: 'capacity', type: 'number' },
    ],
    addBtn: document.getElementById('addTableBtn'),
    defaultItem: { name: 'Nuova postazione', capacity: 2 },
  });

  // ---------- coupon ----------
  data.coupons = data.coupons || [];

  function renderCoupons() {
    const body = document.getElementById('couponsBody');
    if (data.coupons.length === 0) {
      body.innerHTML = `<tr><td colspan="8" class="text-mid small">Nessun coupon creato.</td></tr>`;
      return;
    }
    body.innerHTML = data.coupons.map((c, i) => `
      <tr>
        <td><input type="text" data-c-field="code" data-i="${i}" value="${c.code || ''}" style="min-width:120px; text-transform:uppercase"></td>
        <td>
          <select data-c-field="type" data-i="${i}">
            <option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Percentuale</option>
            <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>Importo fisso (€)</option>
          </select>
        </td>
        <td><input type="number" data-c-field="value" data-i="${i}" value="${c.value ?? 0}" min="0" step="0.5" style="width:80px"></td>
        <td><input type="date" data-c-field="valid_to" data-i="${i}" value="${c.valid_to || ''}"></td>
        <td><input type="number" data-c-field="max_uses" data-i="${i}" value="${c.max_uses ?? 0}" min="0" style="width:80px" title="0 = illimitati"></td>
        <td class="small text-mid">${c.used_count || 0}</td>
        <td><input type="checkbox" data-c-field="active" data-i="${i}" ${c.active ? 'checked' : ''} style="width:auto"></td>
        <td><button class="btn btn-danger btn-sm" data-c-remove="${i}">Rimuovi</button></td>
      </tr>`).join('');

    body.querySelectorAll('[data-c-field]').forEach(inp => inp.addEventListener('change', () => {
      const i = parseInt(inp.dataset.i, 10);
      const field = inp.dataset.cField;
      const c = data.coupons[i];
      if (field === 'active') c[field] = inp.checked;
      else if (field === 'value' || field === 'max_uses') c[field] = parseFloat(inp.value) || 0;
      else if (field === 'code') c[field] = inp.value.trim().toUpperCase();
      else c[field] = inp.value;
      saveData(data);
      showToast('Salvato', 'success');
    }));
    body.querySelectorAll('[data-c-remove]').forEach(btn => btn.addEventListener('click', () => {
      data.coupons.splice(parseInt(btn.dataset.cRemove, 10), 1);
      saveData(data);
      renderCoupons();
      showToast('Coupon rimosso');
    }));
  }
  renderCoupons();

  document.getElementById('addCouponBtn').addEventListener('click', () => {
    data.coupons.push({ id: uid(), code: 'SCONTO' + (data.coupons.length + 1), type: 'percent', value: 10, valid_from: '', valid_to: '', max_uses: 0, used_count: 0, active: true });
    saveData(data);
    renderCoupons();
  });

  // ---------- dati ----------
  document.getElementById('resetDemoBtn').addEventListener('click', async () => {
    if (!confirm('Ripristinare i dati di esempio originali? Tutte le modifiche andranno perse.')) return;
    await resetDemoData();
    showToast('Dati di esempio ripristinati', 'success');
    setTimeout(() => location.reload(), 1200);
  });
  document.getElementById('clearAllBtn').addEventListener('click', async () => {
    if (!confirm('Cancellare TUTTI i dati (menu, prenotazioni, eventi, tavoli, staff, servizi, coupon)? Questa azione non può essere annullata.')) return;
    await clearAllData();
    showToast('Dati cancellati');
    setTimeout(() => location.reload(), 1200);
  });
})();

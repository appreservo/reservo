(function () {
  let data = loadData();
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
  activateTab(['profilo','orari','servizi','staff','postazioni','dati'].includes(initialTab) ? initialTab : 'profilo');

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

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    p.business_name = document.getElementById('pName').value.trim();
    p.type = document.getElementById('pType').value;
    p.email = document.getElementById('pEmail').value.trim();
    p.phone = document.getElementById('pPhone').value.trim();
    p.address = document.getElementById('pAddress').value.trim();
    p.description = document.getElementById('pDescription').value.trim();
    p.booking_mode = document.getElementById('pBookingMode').value;
    p.notification_emails = document.getElementById('pNotifyEmails').value.trim();
    saveData(data);
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
          ${fields.map(f => `<td><input type="${f.type}" data-field="${f.key}" data-i="${i}" value="${item[f.key] ?? ''}" ${f.type==='number'?'min="0"':''} style="min-width:80px"></td>`).join('')}
          <td><button class="btn btn-danger btn-sm" data-remove="${i}">Rimuovi</button></td>
        </tr>`).join('');

      body.querySelectorAll('[data-field]').forEach(inp => inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.i, 10);
        const field = fields.find(f => f.key === inp.dataset.field);
        items[i][inp.dataset.field] = field.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value;
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
    ],
    addBtn: document.getElementById('addServiceBtn'),
    defaultItem: { name: 'Nuovo servizio', duration: 30, price: 0 },
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

  // ---------- dati ----------
  document.getElementById('resetDemoBtn').addEventListener('click', () => {
    if (!confirm('Ripristinare i dati demo originali? Tutte le modifiche andranno perse.')) return;
    resetDemoData();
    showToast('Dati demo ripristinati', 'success');
    setTimeout(() => location.reload(), 600);
  });
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (!confirm('Cancellare TUTTI i dati (menu, prenotazioni, eventi)? Questa azione non può essere annullata.')) return;
    clearAllData();
    showToast('Dati cancellati');
    setTimeout(() => location.reload(), 600);
  });
})();

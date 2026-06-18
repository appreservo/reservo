(async function () {
  const data = await loadData();
  renderLayout('Clienti', data);

  const customers = getCustomers(await loadAllBookings());

  // ---------- anagrafica clienti (attivabile/disattivabile da Impostazioni, per qualsiasi tipo di attività) ----------
  const hiddenFeatures = data.profile.hidden_features || [];
  const hiddenFields = data.profile.hidden_fields || [];
  const isAnagraficaBusiness = !hiddenFeatures.includes('customers_registry');
  const showBirthDate = !hiddenFields.includes('birth_date');
  const showFiscalCode = !hiddenFields.includes('fiscal_code');
  data.customers = data.customers || [];
  document.getElementById('anagraficaCard').style.display = isAnagraficaBusiness ? '' : 'none';
  document.querySelectorAll('.ac-birth-date').forEach(el => el.style.display = showBirthDate ? '' : 'none');
  document.querySelectorAll('.ac-fiscal-code').forEach(el => el.style.display = showFiscalCode ? '' : 'none');

  function fullName(c) {
    return [c.name, c.surname].filter(Boolean).join(' ');
  }

  function bookingsForCustomer(c) {
    const key = (c.email || '').toLowerCase();
    const keyPhone = (c.phone || '').toLowerCase();
    return customers
      .filter(bc => (key && (bc.email || '').toLowerCase() === key) || (keyPhone && (bc.phone || '').toLowerCase() === keyPhone))
      .flatMap(bc => bc.bookings);
  }

  function renderAnagrafica(filter) {
    if (!isAnagraficaBusiness) return;
    const f = (filter || '').toLowerCase().trim();
    let list = data.customers.slice();
    if (f) {
      list = list.filter(c =>
        fullName(c).toLowerCase().includes(f) ||
        (c.email || '').toLowerCase().includes(f) ||
        (c.phone || '').toLowerCase().includes(f) ||
        (c.fiscal_code || '').toLowerCase().includes(f));
    }
    list.sort((a, b) => fullName(a).localeCompare(fullName(b)));

    const container = document.getElementById('anagraficaTable');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessun cliente in anagrafica. Usa "+ Aggiungi cliente" per inserirne uno.</p></div>`;
      return;
    }

    container.innerHTML = `<table><thead><tr>
        <th>Nome</th><th>Contatti</th>${showBirthDate ? '<th>Data di nascita</th>' : ''}${showFiscalCode ? '<th>Codice fiscale</th>' : ''}<th></th>
      </tr></thead><tbody>` +
      list.map(c => `<tr>
        <td data-label="Nome"><strong>${escapeHtml(fullName(c))}</strong></td>
        <td data-label="Contatti" class="small text-mid">${[c.email, c.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
        ${showBirthDate ? `<td data-label="Data di nascita">${c.birth_date ? fmtDateShort(c.birth_date) : ''}</td>` : ''}
        ${showFiscalCode ? `<td data-label="Codice fiscale" class="small text-mid">${escapeHtml(c.fiscal_code || '')}</td>` : ''}
        <td data-label="">
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" data-scheda="${c.id}">Scheda</button>
            <button class="btn btn-outline btn-sm" data-edit-customer="${c.id}">Modifica</button>
          </div>
        </td>
      </tr>`).join('') + `</tbody></table>`;

    container.querySelectorAll('[data-scheda]').forEach(btn => btn.addEventListener('click', () => {
      openScheda(data.customers.find(c => c.id === btn.dataset.scheda));
    }));
    container.querySelectorAll('[data-edit-customer]').forEach(btn => btn.addEventListener('click', () => {
      openAnagraficaModal(data.customers.find(c => c.id === btn.dataset.editCustomer));
    }));
  }

  function openAnagraficaModal(customer) {
    document.getElementById('anagraficaModalTitle').textContent = customer ? 'Modifica cliente' : 'Nuovo cliente';
    document.getElementById('acId').value = customer ? customer.id : '';
    document.getElementById('acName').value = customer ? customer.name : '';
    document.getElementById('acSurname').value = customer ? (customer.surname || '') : '';
    document.getElementById('acEmail').value = customer ? (customer.email || '') : '';
    document.getElementById('acPhone').value = customer ? (customer.phone || '') : '';
    document.getElementById('acBirthDate').value = customer ? (customer.birth_date || '') : '';
    document.getElementById('acFiscalCode').value = customer ? (customer.fiscal_code || '') : '';
    document.getElementById('acAddress').value = customer ? (customer.address || '') : '';
    document.getElementById('acNotes').value = customer ? (customer.notes || '') : '';
    document.getElementById('deleteCustomerBtn').style.display = customer ? 'inline-flex' : 'none';
    document.getElementById('schedaModal').classList.remove('open');
    document.getElementById('anagraficaModal').classList.add('open');
  }

  document.getElementById('anagraficaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('acId').value;
    const payload = {
      name: document.getElementById('acName').value.trim(),
      surname: document.getElementById('acSurname').value.trim(),
      email: document.getElementById('acEmail').value.trim(),
      phone: document.getElementById('acPhone').value.trim(),
      birth_date: document.getElementById('acBirthDate').value,
      fiscal_code: document.getElementById('acFiscalCode').value.trim().toUpperCase(),
      address: document.getElementById('acAddress').value.trim(),
      notes: document.getElementById('acNotes').value.trim(),
    };
    if (id) {
      Object.assign(data.customers.find(c => c.id === id), payload);
      showToast('Cliente aggiornato', 'success');
    } else {
      payload.id = uid();
      payload.created_at = new Date().toISOString();
      data.customers.push(payload);
      showToast('Cliente aggiunto', 'success');
    }
    saveData(data);
    document.getElementById('anagraficaModal').classList.remove('open');
    renderAnagrafica(document.getElementById('anagraficaSearch').value);
  });

  document.getElementById('deleteCustomerBtn').addEventListener('click', () => {
    const id = document.getElementById('acId').value;
    if (!id) return;
    if (!confirm('Eliminare questo cliente dall\'anagrafica?')) return;
    data.customers = data.customers.filter(c => c.id !== id);
    saveData(data);
    document.getElementById('anagraficaModal').classList.remove('open');
    showToast('Cliente eliminato');
    renderAnagrafica(document.getElementById('anagraficaSearch').value);
  });

  function openScheda(customer) {
    if (!customer) return;
    document.getElementById('schedaModalTitle').textContent = fullName(customer);
    const bookings = bookingsForCustomer(customer).slice().sort((a, b) => b.date.localeCompare(a.date));
    document.getElementById('schedaModalBody').innerHTML = `
      <table class="responsive-table" style="margin-bottom:1rem">
        <tbody>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(customer.email || '—')}</td></tr>
          <tr><td><strong>Telefono</strong></td><td>${escapeHtml(customer.phone || '—')}</td></tr>
          ${showBirthDate ? `<tr><td><strong>Data di nascita</strong></td><td>${customer.birth_date ? fmtDateShort(customer.birth_date) : '—'}</td></tr>` : ''}
          ${showFiscalCode ? `<tr><td><strong>Codice fiscale</strong></td><td>${escapeHtml(customer.fiscal_code || '—')}</td></tr>` : ''}
          <tr><td><strong>Indirizzo</strong></td><td>${escapeHtml(customer.address || '—')}</td></tr>
          <tr><td><strong>Note</strong></td><td>${escapeHtml(customer.notes || '—')}</td></tr>
        </tbody>
      </table>
      <h4 style="margin:0 0 .5rem">Storico prenotazioni</h4>
      ${bookings.length === 0 ? '<p class="text-mid small">Nessuna prenotazione registrata per questo cliente.</p>' :
        `<table><thead><tr><th>Data</th><th>Ora</th><th>Persone</th><th>Stato</th></tr></thead><tbody>` +
        bookings.map(b => `<tr>
          <td data-label="Data">${fmtDateShort(b.date)}</td>
          <td data-label="Ora">${b.time}</td>
          <td data-label="Persone">${b.party_size}</td>
          <td data-label="Stato"><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
        </tr>`).join('') + `</tbody></table>`}
    `;
    document.getElementById('schedaEditBtn').onclick = () => openAnagraficaModal(customer);
    document.getElementById('schedaModal').classList.add('open');
  }

  document.getElementById('addCustomerBtn').addEventListener('click', () => openAnagraficaModal(null));
  document.getElementById('anagraficaSearch').addEventListener('input', (e) => renderAnagrafica(e.target.value));
  renderAnagrafica('');

  function render(filter) {
    const f = (filter || '').toLowerCase().trim();
    let list = customers;
    if (f) {
      list = customers.filter(c =>
        (c.name || '').toLowerCase().includes(f) ||
        (c.email || '').toLowerCase().includes(f) ||
        (c.phone || '').toLowerCase().includes(f));
    }

    const container = document.getElementById('customersTable');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessun cliente trovato.</p></div>`;
      return;
    }

    container.innerHTML = `<table><thead><tr>
        <th>Nome</th><th>Contatti</th><th>Prenotazioni</th><th>Ultima prenotazione</th><th></th>
      </tr></thead><tbody>` +
      list.map((c, i) => {
        const sorted = c.bookings.slice().sort((a,b) => b.date.localeCompare(a.date));
        const last = sorted[0];
        const confirmed = c.bookings.filter(b => b.status === 'confirmed').length;
        return `<tr>
          <td data-label="Nome"><strong>${escapeHtml(c.name)}</strong></td>
          <td data-label="Contatti" class="small text-mid">${[c.email, c.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
          <td data-label="Prenotazioni">${c.bookings.length} <span class="small text-mid">(${confirmed} confermate)</span></td>
          <td data-label="Ultima prenotazione">${fmtDateShort(last.date)} alle ${last.time}</td>
          <td data-label=""><button class="btn btn-outline btn-sm" data-show="${i}">Storico</button></td>
        </tr>`;
      }).join('') + `</tbody></table>`;

    container.querySelectorAll('[data-show]').forEach(btn => btn.addEventListener('click', () => {
      showCustomer(list[parseInt(btn.dataset.show, 10)]);
    }));
  }

  function showCustomer(c) {
    document.getElementById('customerModalTitle').textContent = c.name;
    const sorted = c.bookings.slice().sort((a,b) => b.date.localeCompare(a.date));
    document.getElementById('customerModalBody').innerHTML = `
      <p class="small text-mid">${[c.email, c.phone].filter(Boolean).map(escapeHtml).join(' · ')}</p>
      <table><thead><tr><th>Data</th><th>Ora</th><th>Persone</th><th>Stato</th><th>Note</th></tr></thead><tbody>
        ${sorted.map(b => `<tr>
          <td data-label="Data">${fmtDateShort(b.date)}</td>
          <td data-label="Ora">${b.time}</td>
          <td data-label="Persone">${b.party_size}</td>
          <td data-label="Stato"><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
          <td data-label="Note" class="small text-mid">${escapeHtml(b.notes || '')}</td>
        </tr>`).join('')}
      </tbody></table>`;
    document.getElementById('customerModal').classList.add('open');
  }

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').classList.remove('open');
  }));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => {
    if (e.target === ov) ov.classList.remove('open');
  }));

  document.getElementById('searchInput').addEventListener('input', (e) => render(e.target.value));

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    exportCSV('clienti.csv', customers, [
      { label: 'Nome', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Telefono', value: 'phone' },
      { label: 'Prenotazioni', value: c => c.bookings.length },
      { label: 'Confermate', value: c => c.bookings.filter(b => b.status === 'confirmed').length },
      { label: 'Ultima prenotazione', value: c => c.bookings.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date },
    ]);
  });

  render('');
})();

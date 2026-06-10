(function () {
  const data = loadData();
  renderLayout('Clienti', data);

  const customers = getCustomers(data);

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
          <td><strong>${c.name}</strong></td>
          <td class="small text-mid">${[c.email, c.phone].filter(Boolean).join('<br>')}</td>
          <td>${c.bookings.length} <span class="small text-mid">(${confirmed} confermate)</span></td>
          <td>${fmtDateShort(last.date)} alle ${last.time}</td>
          <td><button class="btn btn-outline btn-sm" data-show="${i}">Storico</button></td>
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
      <p class="small text-mid">${[c.email, c.phone].filter(Boolean).join(' · ')}</p>
      <table><thead><tr><th>Data</th><th>Ora</th><th>Persone</th><th>Stato</th><th>Note</th></tr></thead><tbody>
        ${sorted.map(b => `<tr>
          <td>${fmtDateShort(b.date)}</td>
          <td>${b.time}</td>
          <td>${b.party_size}</td>
          <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
          <td class="small text-mid">${b.notes || ''}</td>
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

  render('');
})();

(async function () {
  const data = await loadData();
  renderLayout('Tavoli', data);

  const businessUid = window.reservoAuth.getBusinessUid();
  let liveBookings = await window.reservoAuth.getBusinessBookings(businessUid).catch(() => []);

  function allBookings() {
    return data.bookings.concat(liveBookings);
  }

  function findBooking(id) {
    return data.bookings.find(b => b.id === id) || liveBookings.find(b => b.id === id);
  }

  async function setTable(id, tableId) {
    const b = findBooking(id);
    if (!b) return;
    b.table_id = tableId || null;
    if (b.businessUid) {
      await window.reservoAuth.updateBooking(id, { table_id: b.table_id });
    } else {
      saveData(data);
    }
    render();
  }

  const dateInput = document.getElementById('tableDate');
  dateInput.value = todayStr();

  function render() {
    const dateStr = dateInput.value;
    const dayBookings = allBookings()
      .filter(b => b.date === dateStr && b.status !== 'cancelled' && b.status !== 'rejected')
      .sort((a, b) => a.time.localeCompare(b.time));

    const tableOptions = (b) => `<option value="">— Nessuno —</option>` +
      (data.tables || []).map(t => `<option value="${t.id}" ${b.table_id === t.id ? 'selected' : ''}>${t.name} (${t.capacity} posti)</option>`).join('');

    // tabelle
    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = (data.tables || []).map(t => {
      const bookings = dayBookings.filter(b => b.table_id === t.id);
      return `<div class="card">
        <div class="card-header"><h3>${t.name}</h3><span class="badge badge-navy">${t.capacity} posti</span></div>
        ${bookings.length === 0 ? `<p class="text-mid small">Nessuna prenotazione.</p>` : bookings.map(b => `
          <div class="flex justify-between items-center" style="padding:.4rem 0; border-bottom:1px solid var(--border)">
            <div>
              <strong>${b.time}</strong> — ${escapeHtml(b.customer_name)} (${b.party_size} pers.)
              <div><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></div>
            </div>
            <select data-assign="${b.id}" style="width:auto">${tableOptions(b)}</select>
          </div>`).join('')}
      </div>`;
    }).join('');

    // senza tavolo
    const unassigned = dayBookings.filter(b => !b.table_id);
    const unassignedEl = document.getElementById('unassignedList');
    if (unassigned.length === 0) {
      unassignedEl.innerHTML = `<div class="empty-state"><p>Tutte le prenotazioni del giorno hanno un tavolo assegnato.</p></div>`;
    } else {
      unassignedEl.innerHTML = `<table><thead><tr><th>Ora</th><th>Cliente</th><th>Persone</th><th>Stato</th><th>Tavolo</th></tr></thead><tbody>` +
        unassigned.map(b => `<tr>
          <td data-label="Ora">${b.time}</td>
          <td data-label="Cliente">${escapeHtml(b.customer_name)}</td>
          <td data-label="Persone">${b.party_size}</td>
          <td data-label="Stato"><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
          <td data-label="Tavolo"><select data-assign="${b.id}" style="width:auto">${tableOptions(b)}</select></td>
        </tr>`).join('') + `</tbody></table>`;
    }

    document.querySelectorAll('[data-assign]').forEach(sel => sel.addEventListener('change', () => {
      setTable(sel.dataset.assign, sel.value);
    }));
  }

  dateInput.addEventListener('change', render);
  document.getElementById('prevDay').addEventListener('click', () => {
    dateInput.value = fmtDate(addDays(new Date(dateInput.value + 'T00:00:00'), -1));
    render();
  });
  document.getElementById('nextDay').addEventListener('click', () => {
    dateInput.value = fmtDate(addDays(new Date(dateInput.value + 'T00:00:00'), 1));
    render();
  });

  render();
})();

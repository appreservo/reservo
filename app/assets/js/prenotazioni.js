(function () {
  let data = loadData();
  renderLayout('Prenotazioni', data);

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth(); // 0-11
  let filterDate = null; // 'YYYY-MM-DD' or null
  const MONTH_NAMES = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const DOW_SHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

  function renderCalendar() {
    document.getElementById('calTitle').textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    DOW_SHORT.forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1);
    let startOffset = firstDay.getDay() - 1; // Monday = 0
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStrV = todayStr();

    for (let i = 0; i < startOffset; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-cell empty';
      grid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = fmtDate(new Date(viewYear, viewMonth, d));
      const cell = document.createElement('div');
      cell.className = 'calendar-cell' + (dateStr === todayStrV ? ' today' : '');
      const dayBookings = data.bookings.filter(b => b.date === dateStr && b.status !== 'cancelled' && b.status !== 'rejected');
      let pillsHtml = '';
      dayBookings.slice(0, 3).forEach(b => {
        pillsHtml += `<div class="cal-pill ${b.status}">${b.time} ${b.customer_name}</div>`;
      });
      if (dayBookings.length > 3) {
        pillsHtml += `<div class="cal-pill">+${dayBookings.length - 3} altre</div>`;
      }
      cell.innerHTML = `<div class="date-num">${d}</div>${pillsHtml}`;
      cell.addEventListener('click', () => openDayModal(dateStr));
      grid.appendChild(cell);
    }
  }

  function renderTable() {
    const status = document.getElementById('filterStatus').value;
    let list = data.bookings.slice();
    if (status) list = list.filter(b => b.status === status);
    if (filterDate) list = list.filter(b => b.date === filterDate);
    list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    const container = document.getElementById('bookingsTable');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione trovata.</p></div>`;
      return;
    }

    container.innerHTML = `<table><thead><tr>
        <th>Data</th><th>Ora</th><th>Cliente</th><th>Contatti</th><th>Persone</th><th>Stato</th><th>Note</th><th></th>
      </tr></thead><tbody>` +
      list.map(b => `<tr>
        <td>${fmtDateShort(b.date)}</td>
        <td>${b.time}</td>
        <td>${b.customer_name}</td>
        <td class="small text-mid">${[b.email, b.phone].filter(Boolean).join('<br>')}</td>
        <td>${b.party_size}</td>
        <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
        <td class="small text-mid">${b.notes || ''}</td>
        <td>
          <div class="flex gap-2">
            ${b.status === 'pending' ? `<button class="btn btn-outline btn-sm" data-approve="${b.id}">✓ Conferma</button><button class="btn btn-danger btn-sm" data-reject="${b.id}">✕ Rifiuta</button>` : ''}
            <button class="btn btn-outline btn-sm" data-edit="${b.id}">Modifica</button>
          </div>
        </td>
      </tr>`).join('') + `</tbody></table>`;

    container.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => {
      setStatus(btn.dataset.approve, 'confirmed');
    }));
    container.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', () => {
      setStatus(btn.dataset.reject, 'rejected');
    }));
    container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      openBookingModal(data.bookings.find(b => b.id === btn.dataset.edit));
    }));
  }

  function setStatus(id, status) {
    const b = data.bookings.find(x => x.id === id);
    if (!b) return;
    b.status = status;
    saveData(data);
    showToast(status === 'confirmed' ? 'Prenotazione confermata' : 'Prenotazione rifiutata', status === 'confirmed' ? 'success' : 'error');
    renderAll();
  }

  function renderAll() {
    renderCalendar();
    renderTable();
  }

  // ---------- Booking modal ----------
  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');

  function openBookingModal(booking, presetDate) {
    document.getElementById('bookingModalTitle').textContent = booking ? 'Modifica prenotazione' : 'Nuova prenotazione';
    document.getElementById('bookingId').value = booking ? booking.id : '';
    document.getElementById('bCustomerName').value = booking ? booking.customer_name : '';
    document.getElementById('bPartySize').value = booking ? booking.party_size : 2;
    document.getElementById('bEmail').value = booking ? (booking.email || '') : '';
    document.getElementById('bPhone').value = booking ? (booking.phone || '') : '';
    document.getElementById('bDate').value = booking ? booking.date : (presetDate || todayStr());
    document.getElementById('bTime').value = booking ? booking.time : '20:00';
    document.getElementById('bStatus').value = booking ? booking.status : 'confirmed';
    document.getElementById('bNotes').value = booking ? (booking.notes || '') : '';
    document.getElementById('deleteBookingBtn').style.display = booking ? 'inline-flex' : 'none';
    bookingModal.classList.add('open');
  }

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('bookingId').value;
    const payload = {
      customer_name: document.getElementById('bCustomerName').value.trim(),
      party_size: parseInt(document.getElementById('bPartySize').value, 10) || 1,
      email: document.getElementById('bEmail').value.trim(),
      phone: document.getElementById('bPhone').value.trim(),
      date: document.getElementById('bDate').value,
      time: document.getElementById('bTime').value,
      status: document.getElementById('bStatus').value,
      notes: document.getElementById('bNotes').value.trim(),
    };
    if (id) {
      const b = data.bookings.find(x => x.id === id);
      Object.assign(b, payload);
      showToast('Prenotazione aggiornata', 'success');
    } else {
      payload.id = uid();
      payload.created_at = new Date().toISOString();
      data.bookings.push(payload);
      showToast('Prenotazione creata', 'success');
    }
    saveData(data);
    bookingModal.classList.remove('open');
    renderAll();
  });

  document.getElementById('deleteBookingBtn').addEventListener('click', () => {
    const id = document.getElementById('bookingId').value;
    if (!id) return;
    if (!confirm('Eliminare questa prenotazione?')) return;
    data.bookings = data.bookings.filter(b => b.id !== id);
    saveData(data);
    bookingModal.classList.remove('open');
    showToast('Prenotazione eliminata');
    renderAll();
  });

  document.getElementById('newBookingBtn').addEventListener('click', () => openBookingModal(null));

  // ---------- Day modal ----------
  const dayModal = document.getElementById('dayModal');
  let currentDayDate = null;

  function openDayModal(dateStr) {
    currentDayDate = dateStr;
    document.getElementById('dayModalTitle').textContent = fmtDateLong(dateStr);
    const list = document.getElementById('dayModalList');
    const dayBookings = data.bookings.filter(b => b.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
    if (dayBookings.length === 0) {
      list.innerHTML = `<p class="text-mid">Nessuna prenotazione per questo giorno.</p>`;
    } else {
      list.innerHTML = dayBookings.map(b => `
        <div class="flex justify-between items-center" style="padding:.5rem 0; border-bottom:1px solid var(--border)">
          <div>
            <strong>${b.time}</strong> — ${b.customer_name} (${b.party_size} pers.)
            <div class="small text-mid">${[b.email,b.phone].filter(Boolean).join(' · ')}</div>
          </div>
          <div class="flex gap-2 items-center">
            <span class="badge badge-${b.status}">${statusLabel(b.status)}</span>
            <button class="btn btn-outline btn-sm" data-day-edit="${b.id}">Modifica</button>
          </div>
        </div>`).join('');
      list.querySelectorAll('[data-day-edit]').forEach(btn => btn.addEventListener('click', () => {
        dayModal.classList.remove('open');
        openBookingModal(data.bookings.find(b => b.id === btn.dataset.dayEdit));
      }));
    }
    dayModal.classList.add('open');
  }

  document.getElementById('dayModalAdd').addEventListener('click', () => {
    dayModal.classList.remove('open');
    openBookingModal(null, currentDayDate);
  });

  // ---------- generic close ----------
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').classList.remove('open');
  }));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => {
    if (e.target === ov) ov.classList.remove('open');
  }));

  // ---------- nav ----------
  document.getElementById('prevMonth').addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });
  document.getElementById('filterStatus').addEventListener('change', renderTable);

  renderAll();
})();

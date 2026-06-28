(async function () {
  let data = await loadData();
  renderLayout('Prenotazioni', data);

  const businessUid = window.reservoAuth.getBusinessUid();
  let liveBookings = await window.reservoAuth.getBusinessBookings(businessUid).catch(() => []);

  function allBookings() {
    return data.bookings.concat(liveBookings);
  }

  function findBooking(id) {
    return data.bookings.find(b => b.id === id) || liveBookings.find(b => b.id === id);
  }

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
      const dayBookings = allBookings().filter(b => b.date === dateStr && b.status !== 'cancelled' && b.status !== 'rejected')
        .sort((a, b) => a.time.localeCompare(b.time));
      let pillsHtml = '';
      dayBookings.slice(0, 3).forEach(b => {
        pillsHtml += `<div class="cal-pill ${b.status}">${b.time} ${escapeHtml(b.customer_name)}</div>`;
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
    let list = allBookings();
    if (status) list = list.filter(b => b.status === status);
    if (filterDate) list = list.filter(b => b.date === filterDate);
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const container = document.getElementById('bookingsTable');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione trovata.</p></div>`;
      return;
    }

    container.innerHTML = `<table><thead><tr>
        <th>Data</th><th>Ora</th><th>Cliente</th><th>Contatti</th><th>Persone</th><th>Stato</th><th>Note</th><th></th>
      </tr></thead><tbody>` +
      list.map(b => `<tr>
        <td data-label="Data">${fmtDateShort(b.date)}</td>
        <td data-label="Ora">${b.time}</td>
        <td data-label="Cliente">${escapeHtml(b.customer_name)}</td>
        <td data-label="Contatti" class="small text-mid">${[b.email, b.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
        <td data-label="Persone">${b.party_size}</td>
        <td data-label="Stato"><span class="badge badge-${b.status}">${statusLabel(b.status)}</span>${b.businessUid ? ' <span class="badge badge-navy">Sito</span>' : ''}${b.is_reminder ? ' <span class="badge badge-navy">Promemoria</span>' : ''}</td>
        <td data-label="Note" class="small text-mid">${escapeHtml(b.notes || '')}</td>
        <td data-label="">
          <div class="flex gap-2">
            ${b.status === 'pending'
              ? `<button class="btn btn-gold btn-sm" data-accept="${b.id}">✓ Accetta</button>
                 <button class="btn btn-danger btn-sm" data-reject="${b.id}">✕ Rifiuta</button>`
              : (b.status === 'confirmed' || b.status === 'rejected') && b.businessUid
                ? `${!b.notify_requested && b.status_notified !== b.status
                    ? `<button class="btn btn-outline btn-sm" data-notify="${b.id}">✉ Notifica</button>`
                    : b.notify_requested
                      ? `<span class="text-mid" style="white-space:nowrap;font-size:.72rem">✓ Email in coda</span>`
                      : ''}
                   ${b.email ? `<button class="btn btn-outline btn-sm" data-contact="${b.id}">Contatta</button>` : ''}`
                : ''}
            <button class="btn btn-outline btn-sm" data-edit="${b.id}">Modifica</button>
          </div>
        </td>
      </tr>`).join('') + `</tbody></table>`;

    container.querySelectorAll('[data-accept]').forEach(btn => btn.addEventListener('click', () => {
      setStatus(btn.dataset.accept, 'confirmed');
    }));
    container.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', () => {
      openRejectModal(btn.dataset.reject);
    }));
    container.querySelectorAll('[data-notify]').forEach(btn => btn.addEventListener('click', () => {
      requestNotify(btn.dataset.notify);
    }));
    container.querySelectorAll('[data-contact]').forEach(btn => btn.addEventListener('click', () => {
      const b = findBooking(btn.dataset.contact);
      if (b && b.email) window.location.href = `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent('Prenotazione - ' + ((data.profile && data.profile.business_name) || 'Reservo'))}`;
    }));
    container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      openBookingModal(findBooking(btn.dataset.edit));
    }));
  }

  async function setStatus(id, status, rejectionReason) {
    const b = findBooking(id);
    if (!b) return;
    b.status = status;
    if (rejectionReason) b.rejection_reason = rejectionReason;
    if (b.businessUid) {
      const payload = { status };
      if (rejectionReason) payload.rejection_reason = rejectionReason;
      await window.reservoAuth.updateBooking(id, payload);
    } else {
      saveData(data);
    }
    showToast(status === 'confirmed' ? 'Prenotazione accettata' : 'Prenotazione rifiutata', status === 'confirmed' ? 'success' : 'error');
    renderAll();
  }

  async function requestNotify(id) {
    const b = findBooking(id);
    if (!b || !b.businessUid) return;
    b.notify_requested = true;
    await window.reservoAuth.updateBooking(id, { notify_requested: true });
    showToast('Email in coda, verrà inviata a breve', 'success');
    renderAll();
  }

  function openRejectModal(id) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <h3>Rifiuta prenotazione</h3>
        <div style="margin-bottom:1rem">
          <label style="display:block;font-size:.85rem;font-weight:700;color:var(--text-mid);margin-bottom:.4rem">Motivazione (opzionale)</label>
          <textarea id="rejectReason" rows="3" placeholder="Es. non disponibili per quella data…" style="width:100%;resize:vertical"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="rejectCancel">Annulla</button>
          <button type="button" class="btn btn-danger" id="rejectConfirm">✕ Rifiuta prenotazione</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#rejectCancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#rejectConfirm').addEventListener('click', () => {
      const reason = overlay.querySelector('#rejectReason').value.trim();
      overlay.remove();
      setStatus(id, 'rejected', reason);
    });
  }

  function renderAll() {
    renderCalendar();
    renderTable();
  }

  // ---------- Booking modal ----------
  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');

  const tableSelect = document.getElementById('bTable');
  tableSelect.innerHTML = '<option value="">— Nessuno —</option>' +
    (data.tables || []).map(t => `<option value="${t.id}">${t.name} (${t.capacity} posti)</option>`).join('');

  // il campo "Tavolo" ha senso solo per i ristoranti, ed e' nascondibile anche dal gestore in Impostazioni
  const isRestaurant = data.profile.type === 'restaurant';
  const hasTablesFeature = isRestaurant && !(data.profile.hidden_features || []).includes('tables');
  document.getElementById('bTableField').style.display = hasTablesFeature ? '' : 'none';

  // ---------- slot picker (blocchi orari per la nuova prenotazione) ----------
  const DEFAULT_SLOT_DURATION = 30; // minuti, usato quando l'attività non ha servizi configurati
  const serviceSelect = document.getElementById('bService');
  const reminderCheckbox = document.getElementById('bIsReminder');
  const slotField = document.getElementById('bSlotField');
  const slotGrid = document.getElementById('bSlotGrid');
  const slotMessage = document.getElementById('bSlotMessage');
  const timeField = document.getElementById('bTimeField');
  const timeInput = document.getElementById('bTime');
  const dateInput = document.getElementById('bDate');
  let selectedSlotTime = '';

  document.getElementById('bServiceField').style.display = (data.services || []).length > 0 ? '' : 'none';
  serviceSelect.innerHTML = (data.services || [])
    .map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${s.duration} min)</option>`).join('');

  function currentServiceDuration() {
    const service = (data.services || []).find(s => s.id === serviceSelect.value);
    return (service && service.duration) || DEFAULT_SLOT_DURATION;
  }

  // Passo della griglia: sempre la durata del servizio più breve configurato,
  // così i blocchi orari restano fini indipendentemente da quale servizio è
  // selezionato (la durata del servizio scelto resta comunque quella usata
  // per il controllo di sovrapposizione, vedi candidateDuration sotto).
  function minServiceDuration() {
    const durations = (data.services || []).map(s => s.duration).filter(Boolean);
    return durations.length ? Math.min(...durations) : DEFAULT_SLOT_DURATION;
  }

  function getDaySlots(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const jsDay = date.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;
    const hours = data.hours.find(h => h.day === ourDay);
    if (!hours || hours.closed) return [];
    if ((data.closures || []).some(c => c.date === dateStr)) return [];

    const dayIntervals = getIntervals(hours).map(iv => {
      const [oh, om] = iv.open.split(':').map(Number);
      const [ch, cm] = iv.close.split(':').map(Number);
      let openMin = oh * 60 + om;
      let closeMin = ch * 60 + cm;
      if (closeMin <= openMin) closeMin += 24 * 60;
      return { openMin, closeMin };
    });
    if (!dayIntervals.length) return [];

    const editingId = document.getElementById('bookingId').value;
    const existing = allBookings().filter(b => b.date === dateStr && b.id !== editingId
      && b.status !== 'cancelled' && b.status !== 'rejected' && !b.is_reminder);
    const partySize = parseInt(document.getElementById('bPartySize').value, 10) || 1;

    function existingService(b) {
      return (data.services || []).find(s => s.id === b.service_id);
    }
    // Durata di una prenotazione esistente (dal suo servizio, se presente).
    // Usa candidateDuration come fallback per coerenza con sito.js.
    function existingBookingDuration(b) {
      const svc = existingService(b);
      return (svc && svc.duration) || candidateDuration;
    }
    // Confronto per sovrapposizione di intervalli: con una sola risorsa
    // disponibile (capacity 1), un appuntamento da 45 min deve bloccare
    // tutta la sua finestra, non solo lo slot che inizia esattamente alla
    // stessa ora.
    function overlaps(startA, durA, startB, durB) {
      return startA < startB + durB && startB < startA + durA;
    }
    // Persone assegnate a un servizio (vedi Impostazioni -> Servizi ->
    // "Assegnato a"); compatibile anche col vecchio campo staff_id singolo.
    function assignedStaffIds(service) {
      if (!service) return [];
      if (Array.isArray(service.staff_ids)) return service.staff_ids;
      return service.staff_id ? [service.staff_id] : [];
    }
    // Due servizi "competono per la stessa risorsa" solo se assegnati
    // esattamente allo stesso gruppo di persone (incluso il gruppo vuoto =
    // "chiunque in staff"): gruppi diversi, anche se si sovrappongono in
    // parte, vengono trattati come risorse indipendenti — per seguire
    // davvero la singola persona tra servizi diversi servirebbe assegnare lo
    // staff alla singola prenotazione, non al servizio.
    function staffSetKey(ids) {
      return ids.length ? ids.slice().sort().join(',') : '';
    }
    function competesForSameResource(b, candidateSetKey) {
      return staffSetKey(assignedStaffIds(existingService(b))) === candidateSetKey;
    }

    const candidateService = (data.services || []).find(s => s.id === serviceSelect.value);
    const candidateStaffIds = hasTablesFeature ? [] : assignedStaffIds(candidateService);
    const candidateSetKey = staffSetKey(candidateStaffIds);
    const capacity = hasTablesFeature
      ? Math.max(1, (data.tables || []).filter(t => t.capacity >= partySize).length)
      // Ristorante senza tavoli: nessun limite di capacità (vedi overlapCount sotto).
      : isRestaurant ? Infinity
      : (candidateStaffIds.length ? candidateStaffIds.length : Math.max(1, (data.staff || []).length));

    const candidateDuration = currentServiceDuration();
    const step = minServiceDuration();

    const slots = [];
    for (const { openMin, closeMin } of dayIntervals) {
      for (let t = openMin; t + candidateDuration <= closeMin; t += step) {
        const hh = String(Math.floor(t / 60) % 24).padStart(2, '0');
        const mm = String(t % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;
        if (slots.some(s => s.time === timeStr)) continue;
        const overlapCount = existing.filter(b => {
          const [bh, bm] = b.time.split(':').map(Number);
          if (!overlaps(t, candidateDuration, bh * 60 + bm, existingBookingDuration(b))) return false;
          return hasTablesFeature || (!isRestaurant && competesForSameResource(b, candidateSetKey));
        }).length;
        slots.push({ time: timeStr, busy: overlapCount >= capacity });
      }
    }
    return slots;
  }

  function renderSlotGrid() {
    const dateStr = dateInput.value;
    slotMessage.textContent = '';
    if (!dateStr) { slotGrid.innerHTML = ''; return; }

    const slots = getDaySlots(dateStr);
    // se l'orario attualmente selezionato non rientra nei blocchi standard (es. dato legacy), lo aggiungo comunque
    if (selectedSlotTime && !slots.some(s => s.time === selectedSlotTime)) {
      slots.push({ time: selectedSlotTime, busy: false });
      slots.sort((a, b) => a.time.localeCompare(b.time));
    }

    if (slots.length === 0) {
      slotGrid.innerHTML = '';
      slotMessage.textContent = 'Nessun blocco orario disponibile per la data scelta (controlla orari di apertura/chiusure).';
      return;
    }
    slotGrid.innerHTML = slots.map(s =>
      `<button type="button" class="slot-btn ${s.busy ? 'busy' : ''} ${s.time === selectedSlotTime ? 'selected' : ''}" data-time="${s.time}" title="${s.busy ? 'Orario già occupato, selezionabile comunque' : ''}">${s.time}</button>`).join('');
    slotGrid.querySelectorAll('.slot-btn').forEach(btn => btn.addEventListener('click', () => {
      selectedSlotTime = btn.dataset.time;
      slotGrid.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('selected', b === btn));
    }));
  }

  function updateModalMode() {
    const isReminder = reminderCheckbox.checked;
    slotField.style.display = isReminder ? 'none' : '';
    document.getElementById('bServiceField').style.display = (!isReminder && (data.services || []).length > 0) ? '' : 'none';
    timeField.style.display = isReminder ? '' : 'none';
    if (!isReminder) renderSlotGrid();
  }

  reminderCheckbox.addEventListener('change', updateModalMode);
  dateInput.addEventListener('change', renderSlotGrid);
  serviceSelect.addEventListener('change', renderSlotGrid);
  document.getElementById('bPartySize').addEventListener('change', renderSlotGrid);

  function openBookingModal(booking, presetDate, presetCustomer) {
    document.getElementById('bookingModalTitle').textContent = booking ? 'Modifica prenotazione' : 'Nuova prenotazione';
    document.getElementById('bookingId').value = booking ? booking.id : '';
    document.getElementById('bookingCustomerId').value = booking ? (booking.customer_id || '') : (presetCustomer ? presetCustomer.id : '');
    document.getElementById('bCustomerName').value = booking ? booking.customer_name : (presetCustomer ? [presetCustomer.name, presetCustomer.surname].filter(Boolean).join(' ') : '');
    document.getElementById('bPartySize').value = booking ? booking.party_size : 1;
    document.getElementById('bEmail').value = booking ? (booking.email || '') : (presetCustomer ? (presetCustomer.email || '') : '');
    document.getElementById('bPhone').value = booking ? (booking.phone || '') : (presetCustomer ? (presetCustomer.phone || '') : '');
    document.getElementById('bDate').value = booking ? booking.date : (presetDate || todayStr());
    serviceSelect.value = booking ? (booking.service_id || '') : (((data.services || [])[0] || {}).id || '');
    reminderCheckbox.checked = booking ? !!booking.is_reminder : false;
    selectedSlotTime = booking ? booking.time : '';
    timeInput.value = booking ? booking.time : '20:00';
    document.getElementById('bStatus').value = booking ? booking.status : 'confirmed';
    document.getElementById('bNotes').value = booking ? (booking.notes || '') : '';
    tableSelect.value = booking ? (booking.table_id || '') : '';
    document.getElementById('deleteBookingBtn').style.display = booking ? 'inline-flex' : 'none';
    const note = document.getElementById('bStatusNote');
    if (note) note.textContent = (!booking && data.profile.booking_mode === 'manual') ? 'Nota: la modalità attiva è "Approvazione manuale", ma le prenotazioni create da qui vengono confermate subito.' : '';
    updateModalMode();
    bookingModal.classList.add('open');
  }

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isReminder = reminderCheckbox.checked;
    const time = isReminder ? timeInput.value : selectedSlotTime;
    if (!time) { showToast('Seleziona un orario', 'error'); return; }
    const id = document.getElementById('bookingId').value;
    const payload = {
      customer_name: document.getElementById('bCustomerName').value.trim(),
      customer_id: document.getElementById('bookingCustomerId').value || null,
      party_size: parseInt(document.getElementById('bPartySize').value, 10) || 1,
      email: document.getElementById('bEmail').value.trim(),
      phone: document.getElementById('bPhone').value.trim(),
      date: document.getElementById('bDate').value,
      time,
      status: document.getElementById('bStatus').value,
      notes: document.getElementById('bNotes').value.trim(),
      table_id: tableSelect.value || null,
      service_id: isReminder ? null : (serviceSelect.value || null),
      is_reminder: isReminder,
    };
    if (id) {
      const b = findBooking(id);
      Object.assign(b, payload);
      if (b.businessUid) {
        await window.reservoAuth.updateBooking(id, payload);
      } else {
        saveData(data);
      }
      showToast('Prenotazione aggiornata', 'success');
    } else {
      payload.id = uid();
      payload.created_at = new Date().toISOString();
      data.bookings.push(payload);
      saveData(data);
      showToast('Prenotazione creata', 'success');
    }
    bookingModal.classList.remove('open');
    renderAll();
  });

  document.getElementById('deleteBookingBtn').addEventListener('click', async () => {
    const id = document.getElementById('bookingId').value;
    if (!id) return;
    if (!confirm('Eliminare questa prenotazione?')) return;
    const b = findBooking(id);
    if (b && b.businessUid) {
      await window.reservoAuth.deleteBooking(id);
      liveBookings = liveBookings.filter(x => x.id !== id);
    } else {
      data.bookings = data.bookings.filter(b => b.id !== id);
      saveData(data);
    }
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
    const dayBookings = allBookings().filter(b => b.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
    if (dayBookings.length === 0) {
      list.innerHTML = `<p class="text-mid">Nessuna prenotazione per questo giorno.</p>`;
    } else {
      list.innerHTML = dayBookings.map(b => `
        <div class="flex justify-between items-center" style="padding:.5rem 0; border-bottom:1px solid var(--border)">
          <div>
            <strong>${b.time}</strong> — ${escapeHtml(b.customer_name)} (${b.party_size} pers.)
            <div class="small text-mid">${[b.email,b.phone].filter(Boolean).map(escapeHtml).join(' · ')}</div>
          </div>
          <div class="flex gap-2 items-center">
            <span class="badge badge-${b.status}">${statusLabel(b.status)}</span>
            <button class="btn btn-outline btn-sm" data-day-edit="${b.id}">Modifica</button>
          </div>
        </div>`).join('');
      list.querySelectorAll('[data-day-edit]').forEach(btn => btn.addEventListener('click', () => {
        dayModal.classList.remove('open');
        openBookingModal(findBooking(btn.dataset.dayEdit));
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
  document.getElementById('prevYear').addEventListener('click', () => {
    viewYear--;
    renderCalendar();
  });
  document.getElementById('nextYear').addEventListener('click', () => {
    viewYear++;
    renderCalendar();
  });
  document.getElementById('filterStatus').addEventListener('change', renderTable);
  document.getElementById('filterDateInput').addEventListener('change', (e) => {
    filterDate = e.target.value || null;
    renderTable();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    const status = document.getElementById('filterStatus').value;
    let list = allBookings();
    if (status) list = list.filter(b => b.status === status);
    if (filterDate) list = list.filter(b => b.date === filterDate);
    list = list.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    exportCSV('prenotazioni.csv', list, [
      { label: 'Data', value: 'date' },
      { label: 'Ora', value: 'time' },
      { label: 'Cliente', value: 'customer_name' },
      { label: 'Email', value: 'email' },
      { label: 'Telefono', value: 'phone' },
      { label: 'Persone', value: 'party_size' },
      { label: 'Stato', value: b => statusLabel(b.status) },
      { label: 'Note', value: 'notes' },
    ]);
  });

  renderAll();

  const _params = new URLSearchParams(window.location.search);
  const _presetCustomerId = _params.get('customer_id');
  if (_presetCustomerId) {
    const _presetCustomer = (data.customers || []).find(c => c.id === _presetCustomerId);
    if (_presetCustomer) {
      history.replaceState(null, '', window.location.pathname);
      openBookingModal(null, null, _presetCustomer);
    }
  }
})();

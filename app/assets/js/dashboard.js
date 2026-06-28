(async function () {
  const data = await loadData();
  renderLayout('Dashboard', data);

  const today = todayStr();

  const allBookings = await loadAllBookings();
  const bookings = allBookings.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const validBookings = bookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled');

  const monthStr = today.slice(0, 7); // YYYY-MM
  const bookingCounts = {
    day: validBookings.filter(b => b.date === today).length,
    month: validBookings.filter(b => b.date.slice(0, 7) === monthStr).length,
    total: validBookings.length,
  };
  const bookingLabels = { day: 'Prenotazioni giornaliere', month: 'Prenotazioni mensili', total: 'Prenotazioni totali' };

  const pending = bookings.filter(b => b.status === 'pending');
  const customers = getCustomers(allBookings);

  document.getElementById('statPending').textContent = pending.length;
  document.getElementById('statCustomers').textContent = customers.length;

  // "Prossime prenotazioni" filtrata con lo stesso criterio dei pulsanti
  // Giornaliere/Mensili/Totali sopra: giornaliere -> solo oggi, mensili ->
  // mese corrente, totali -> tutte le prenotazioni future senza altro limite.
  function getUpcoming(range) {
    const upcoming = validBookings.filter(b => b.date >= today);
    if (range === 'day') return upcoming.filter(b => b.date === today);
    if (range === 'month') return upcoming.filter(b => b.date.slice(0, 7) === monthStr);
    return upcoming;
  }

  const upcomingList = document.getElementById('upcomingList');
  function renderUpcoming(range) {
    const upcoming = getUpcoming(range).slice(0, 6);
    if (upcoming.length === 0) {
      upcomingList.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione in programma.</p></div>`;
    } else {
      upcomingList.innerHTML = `<table><thead><tr><th>Data</th><th>Ora</th><th>Cliente</th><th>Persone</th><th>Stato</th></tr></thead><tbody>` +
        upcoming.map(b => `<tr>
          <td>${fmtDateShort(b.date)}</td>
          <td>${b.time}</td>
          <td>${escapeHtml(b.customer_name)}</td>
          <td>${b.party_size}</td>
          <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
        </tr>`).join('') + `</tbody></table>`;
    }
  }

  function renderBookingStat(range) {
    document.getElementById('statBookingsLabel').textContent = bookingLabels[range];
    document.getElementById('statBookings').textContent = bookingCounts[range];
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.classList.toggle('btn-primary', btn.dataset.range === range);
      btn.classList.toggle('btn-outline', btn.dataset.range !== range);
    });
    renderUpcoming(range);
  }
  document.querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => renderBookingStat(btn.dataset.range)));
  renderBookingStat('day');

  // pending list
  const pendingList = document.getElementById('pendingList');
  if (pending.length === 0) {
    pendingList.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione in attesa di conferma. ✅</p></div>`;
  } else {
    pendingList.innerHTML = `<table><thead><tr><th>Data</th><th>Ora</th><th>Cliente</th><th>Persone</th><th></th></tr></thead><tbody>` +
      pending.slice(0, 6).map(b => `<tr>
        <td>${fmtDateShort(b.date)}</td>
        <td>${b.time}</td>
        <td>${escapeHtml(b.customer_name)}</td>
        <td>${b.party_size}</td>
        <td><a href="prenotazioni.html" class="btn btn-outline btn-sm">Gestisci</a></td>
      </tr>`).join('') + `</tbody></table>`;
  }

  // summary
  document.getElementById('sumName').textContent = data.profile.business_name;
  document.getElementById('sumType').textContent = typeLabel(data.profile.type);
  document.getElementById('sumMode').textContent = data.profile.booking_mode === 'auto' ? 'Conferma automatica' : 'Approvazione manuale';
  const isRestaurant = data.profile.type === 'restaurant';
  document.getElementById('sumMenuLabel').textContent = isRestaurant ? 'Voci menu' : 'Voci listino';
  document.getElementById('sumMenu').textContent = data.menu.length + ' voci';
  document.getElementById('sumEvents').textContent = data.events.filter(e => e.date >= today).length;
  const hasEventsFeature = isRestaurant && !((data.profile.hidden_features || []).includes('events'));
  document.getElementById('sumEventsRow').style.display = hasEventsFeature ? '' : 'none';
  document.getElementById('sumStaff').textContent = data.staff.length + ' persone';

  fillIcons();
})();

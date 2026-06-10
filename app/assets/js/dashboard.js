(function () {
  const data = loadData();
  renderLayout('Dashboard', data);

  const today = todayStr();
  const now = new Date();
  const dow = now.getDay(); // 0=Domenica..6=Sabato
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = addDays(now, -daysSinceMonday);
  const weekStartStr = fmtDate(weekStart);
  const weekEndStr = fmtDate(addDays(weekStart, 6));

  const bookings = data.bookings.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const todayCount = bookings.filter(b => b.date === today && b.status !== 'rejected' && b.status !== 'cancelled').length;
  const pending = bookings.filter(b => b.status === 'pending');
  const weekCount = bookings.filter(b => b.date >= weekStartStr && b.date <= weekEndStr && b.status !== 'rejected' && b.status !== 'cancelled').length;
  const customers = getCustomers(data);

  document.getElementById('statToday').textContent = todayCount;
  document.getElementById('statPending').textContent = pending.length;
  document.getElementById('statWeek').textContent = weekCount;
  document.getElementById('statCustomers').textContent = customers.length;

  // upcoming bookings (today onward, confirmed/pending)
  const upcoming = bookings.filter(b => b.date >= today && b.status !== 'rejected' && b.status !== 'cancelled').slice(0, 6);
  const upcomingList = document.getElementById('upcomingList');
  if (upcoming.length === 0) {
    upcomingList.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione in programma.</p></div>`;
  } else {
    upcomingList.innerHTML = `<table><thead><tr><th>Data</th><th>Ora</th><th>Cliente</th><th>Persone</th><th>Stato</th></tr></thead><tbody>` +
      upcoming.map(b => `<tr>
        <td>${fmtDateShort(b.date)}</td>
        <td>${b.time}</td>
        <td>${b.customer_name}</td>
        <td>${b.party_size}</td>
        <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
      </tr>`).join('') + `</tbody></table>`;
  }

  // pending list
  const pendingList = document.getElementById('pendingList');
  if (pending.length === 0) {
    pendingList.innerHTML = `<div class="empty-state"><p>Nessuna prenotazione in attesa di conferma. ✅</p></div>`;
  } else {
    pendingList.innerHTML = `<table><thead><tr><th>Data</th><th>Ora</th><th>Cliente</th><th>Persone</th><th></th></tr></thead><tbody>` +
      pending.slice(0, 6).map(b => `<tr>
        <td>${fmtDateShort(b.date)}</td>
        <td>${b.time}</td>
        <td>${b.customer_name}</td>
        <td>${b.party_size}</td>
        <td><a href="prenotazioni.html" class="btn btn-outline btn-sm">Gestisci</a></td>
      </tr>`).join('') + `</tbody></table>`;
  }

  // summary
  document.getElementById('sumName').textContent = data.profile.business_name;
  document.getElementById('sumType').textContent = typeLabel(data.profile.type);
  document.getElementById('sumMode').textContent = data.profile.booking_mode === 'auto' ? 'Conferma automatica' : 'Approvazione manuale';
  document.getElementById('sumMenu').textContent = data.menu.length + ' voci';
  document.getElementById('sumEvents').textContent = data.events.filter(e => e.date >= today).length;
  document.getElementById('sumStaff').textContent = data.staff.length + ' persone';

  fillIcons();
})();

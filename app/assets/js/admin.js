/* Reservo - pannello admin: approvazione registrazioni gestori */
document.addEventListener('DOMContentLoaded', () => {
  const pendingTable = document.getElementById('pendingTable');
  const businessTable = document.getElementById('businessTable');
  const businessSearch = document.getElementById('businessSearch');
  const businessStatusFilter = document.getElementById('businessStatusFilter');
  const growthPeriodFilter = document.getElementById('growthPeriodFilter');
  const logoutBtn = document.getElementById('logoutBtn');

  let allBusinesses = [];
  let allGestori = [];

  logoutBtn.addEventListener('click', () => window.reservoAuth.logout());

  function renderPending(list) {
    if (!list.length) {
      pendingTable.innerHTML = '<div class="empty-state">Nessuna richiesta in attesa.</div>';
      return;
    }
    pendingTable.innerHTML = `
      <table>
        <thead><tr><th>Attività</th><th>Tipo</th><th>Referente</th><th>Email</th><th></th></tr></thead>
        <tbody>
          ${list.map(u => `
            <tr>
              <td data-label="Attività">${escapeHtml(u.businessName || '—')}</td>
              <td data-label="Tipo">${typeLabel(u.businessType)}</td>
              <td data-label="Referente">${escapeHtml(u.name || '—')}</td>
              <td data-label="Email">${escapeHtml(u.email || '—')}</td>
              <td data-label="" style="white-space:nowrap">
                <div class="flex gap-2">
                  <button class="btn btn-gold btn-sm" data-approve="${u.id}">Approva</button>
                  <button class="btn btn-danger btn-sm" data-reject="${u.id}">Rifiuta</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    pendingTable.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      await window.reservoAuth.approveAccount(btn.dataset.approve);
      showToast('Account approvato', 'success');
      refresh();
    }));
    pendingTable.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Rifiutare questa richiesta di registrazione?')) return;
      btn.disabled = true;
      await window.reservoAuth.rejectAccount(btn.dataset.reject);
      showToast('Richiesta rifiutata', 'success');
      refresh();
    }));
  }

  function statusBadge(status) {
    if (status === 'rejected') return '<span class="badge badge-rejected">Rifiutata</span>';
    if (status === 'pending') return '<span class="badge badge-pending">In attesa</span>';
    return '<span class="badge badge-confirmed">Attiva</span>';
  }

  function renderBusinesses(list) {
    const search = (businessSearch.value || '').trim().toLowerCase();
    const status = businessStatusFilter.value;
    const filtered = list.filter(b => {
      const normStatus = b.status || 'active';
      if (status && normStatus !== status) return false;
      if (search) {
        const haystack = `${b.business_name || ''} ${b.email || ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      businessTable.innerHTML = '<div class="empty-state">Nessuna attività trovata.</div>';
      return;
    }
    businessTable.innerHTML = `
      <table>
        <thead><tr><th>Attività</th><th class="hide-mobile">Tipo</th><th class="truncate-cell">Email</th><th>Stato</th><th></th></tr></thead>
        <tbody>
          ${filtered.map(b => `
            <tr class="row-link" data-uid="${b.id}">
              <td>${b.business_name || '—'}</td>
              <td class="hide-mobile">${typeLabel(b.type)}</td>
              <td class="truncate-cell">${b.email || '—'}</td>
              <td>${statusBadge(b.status)}</td>
              <td style="white-space:nowrap"><button class="btn btn-danger btn-sm" data-delete="${b.id}">Elimina</button></td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    businessTable.querySelectorAll('tr.row-link').forEach(tr => tr.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete]')) return;
      location.href = `admin-business.html?uid=${tr.dataset.uid}`;
    }));
    businessTable.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const b = allBusinesses.find(x => x.id === btn.dataset.delete);
      if (!confirm(`Eliminare definitivamente "${(b && b.business_name) || 'questa attività'}"? Verranno rimossi profilo, dati attività e prenotazioni. L'operazione non può essere annullata.`)) return;
      btn.disabled = true;
      try {
        await window.reservoAuth.deleteBusinessAccount(btn.dataset.delete);
        allBusinesses = allBusinesses.filter(x => x.id !== btn.dataset.delete);
        showToast('Attività eliminata', 'success');
        renderBusinesses(allBusinesses);
      } catch (err) {
        btn.disabled = false;
        showToast('Errore durante l\'eliminazione', 'error');
      }
    }));
  }

  businessSearch.addEventListener('input', () => renderBusinesses(allBusinesses));
  businessStatusFilter.addEventListener('change', () => renderBusinesses(allBusinesses));
  growthPeriodFilter.addEventListener('change', () => renderGrowthChart(allGestori));

  let growthChart;

  function renderStats(businesses, bookingsCount) {
    const active = businesses.filter(b => !b.status || b.status === 'active').length;
    const pendingCount = businesses.filter(b => b.status === 'pending').length;
    const rejected = businesses.filter(b => b.status === 'rejected').length;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statPendingCount').textContent = pendingCount;
    document.getElementById('statRejected').textContent = rejected;
    document.getElementById('statBookings').textContent = bookingsCount;
  }

  function getISOWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week };
  }

  function renderGrowthChart(users) {
    const period = growthPeriodFilter.value;
    const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const counts = new Map();
    users.forEach(u => {
      const d = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate() : null;
      if (!d) return;
      let key;
      if (period === 'week') {
        const { year, week } = getISOWeek(d);
        key = `${year}-W${String(week).padStart(2, '0')}`;
      } else if (period === 'year') {
        key = `${d.getFullYear()}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    let labels = Array.from(counts.keys()).sort();
    if (period === 'week') labels = labels.slice(-12);
    let niceLabels;
    if (period === 'week') {
      niceLabels = labels.map(k => { const [y, w] = k.split('-W'); return `Sett. ${w} '${y.slice(2)}`; });
    } else if (period === 'year') {
      niceLabels = labels;
    } else {
      niceLabels = labels.map(k => { const [y, m] = k.split('-'); return `${MONTHS[parseInt(m, 10) - 1]} ${y}`; });
    }
    const data = labels.map(k => counts.get(k));

    if (growthChart) growthChart.destroy();
    growthChart = new Chart(document.getElementById('growthChart'), {
      type: 'bar',
      data: { labels: niceLabels, datasets: [{ label: 'Nuove attività registrate', data, backgroundColor: '#C9A227' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  async function refresh() {
    const [pending, businesses, gestori, bookingsCount] = await Promise.all([
      window.reservoAuth.listPendingAccounts(),
      window.reservoAuth.listAllBusinesses(),
      window.reservoAuth.listGestoreUsers().catch(() => []),
      window.reservoAuth.countAllBookings().catch(() => 0),
    ]);
    allBusinesses = businesses;
    allGestori = gestori;
    renderPending(pending);
    renderBusinesses(allBusinesses);
    renderStats(businesses, bookingsCount);
    renderGrowthChart(allGestori);
  }

  function start() { refresh().catch(() => {
    pendingTable.innerHTML = '<div class="empty-state">Impossibile caricare le richieste al momento.</div>';
    businessTable.innerHTML = '';
  }); }

  if (window.reservoAuth && window.reservoAuth.currentUser) start();
  else window.addEventListener('reservo-auth-ready', start, { once: true });
});

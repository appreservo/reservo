/* Reservo - pannello admin: approvazione registrazioni gestori */

/* sidebar + topbar del pannello admin (sezioni in pagina, niente cambio di file: stesso pattern a tab-via-hash di impostazioni.js) */
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'attivita', label: 'Attività', icon: 'customers' },
];

function renderAdminLayout() {
  const profile = window.reservoAuth.currentProfile;

  const sidebarHtml = `<div class="sidebar-group">` +
    ADMIN_NAV.map(item => `<a href="#${item.id}" data-admin-tab="${item.id}" class="sidebar-link">${ICONS[item.icon]}<span>${item.label}</span></a>`).join('') +
    `</div>`;

  const topbarHtml = `
    <div class="flex items-center gap-3">
      <button class="menu-btn" id="menuToggle">${ICONS.menuburger}</button>
      <div class="topbar-brand">
        <img src="assets/img/logo.png" alt="Reservo">
        <span class="topbar-brand-text topbar-brand-text--app">
          <span class="topbar-brand-name">Reservo · Admin</span>
          <span class="js-user-name"></span>
        </span>
      </div>
      <h1 id="adminPageTitle"></h1>
    </div>
    <div class="topbar-actions">
      <div class="badge badge-navy">${(profile && profile.name) || ''}</div>
      <button class="btn btn-outline btn-sm" id="logoutBtn">Esci</button>
    </div>`;

  document.getElementById('sidebar').innerHTML = sidebarHtml;
  document.getElementById('topbar').innerHTML = topbarHtml;

  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  function setSidebarOpen(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    overlay.classList.toggle('open', open);
  }
  document.getElementById('menuToggle').addEventListener('click', () => {
    setSidebarOpen(!document.getElementById('sidebar').classList.contains('open'));
  });
  overlay.addEventListener('click', () => setSidebarOpen(false));
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || e.target.closest('#menuToggle')) return;
    setSidebarOpen(false);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => window.reservoAuth.logout());

  function activateAdminTab(id) {
    const valid = ADMIN_NAV.some(item => item.id === id) ? id : 'dashboard';
    document.querySelectorAll('[data-admin-tab]').forEach(a => a.classList.toggle('active', a.dataset.adminTab === valid));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + valid));
    document.getElementById('adminPageTitle').textContent = ADMIN_NAV.find(item => item.id === valid).label;
    setSidebarOpen(false);
  }
  document.querySelectorAll('[data-admin-tab]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    history.replaceState(null, '', '#' + a.dataset.adminTab);
    activateAdminTab(a.dataset.adminTab);
  }));
  activateAdminTab(location.hash ? location.hash.slice(1) : 'dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  const pendingTable = document.getElementById('pendingTable');
  const businessTable = document.getElementById('businessTable');
  const businessSearch = document.getElementById('businessSearch');
  const businessStatusFilter = document.getElementById('businessStatusFilter');
  const growthPeriodFilter = document.getElementById('growthPeriodFilter');

  let allBusinesses = [];
  let allGestori = [];

  function start() {
    renderAdminLayout();
    refresh().catch(() => {
      pendingTable.innerHTML = '<div class="empty-state">Impossibile caricare le richieste al momento.</div>';
      businessTable.innerHTML = '';
    });
  }

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

  if (window.reservoAuth && window.reservoAuth.currentUser) start();
  else window.addEventListener('reservo-auth-ready', start, { once: true });
});

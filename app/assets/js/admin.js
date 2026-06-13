/* Reservo - pannello admin: approvazione registrazioni gestori */
document.addEventListener('DOMContentLoaded', () => {
  const pendingTable = document.getElementById('pendingTable');
  const businessTable = document.getElementById('businessTable');
  const businessSearch = document.getElementById('businessSearch');
  const businessStatusFilter = document.getElementById('businessStatusFilter');
  const reviewsTable = document.getElementById('reviewsTable');
  const reviewStatusFilter = document.getElementById('reviewStatusFilter');
  const logoutBtn = document.getElementById('logoutBtn');

  let allBusinesses = [];
  let allReviews = [];

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
              <td>${u.businessName || '—'}</td>
              <td>${typeLabel(u.businessType)}</td>
              <td>${u.name || '—'}</td>
              <td>${u.email || '—'}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-gold btn-sm" data-approve="${u.id}">Approva</button>
                <button class="btn btn-danger btn-sm" data-reject="${u.id}">Rifiuta</button>
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
        <thead><tr><th>Attività</th><th>Tipo</th><th>Email</th><th>Stato</th></tr></thead>
        <tbody>
          ${filtered.map(b => `
            <tr class="row-link" data-uid="${b.id}">
              <td>${b.business_name || '—'}</td>
              <td>${typeLabel(b.type)}</td>
              <td>${b.email || '—'}</td>
              <td>${statusBadge(b.status)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    businessTable.querySelectorAll('tr.row-link').forEach(tr => tr.addEventListener('click', () => {
      location.href = `admin-business.html?uid=${tr.dataset.uid}`;
    }));
  }

  function renderReviews(list) {
    const status = reviewStatusFilter.value;
    const filtered = status ? list.filter(r => r.status === status) : list.slice();
    filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    if (!filtered.length) {
      reviewsTable.innerHTML = '<div class="empty-state">Nessuna recensione da mostrare.</div>';
      return;
    }
    reviewsTable.innerHTML = filtered.map(r => `
      <div class="review-card">
        <div class="review-head">
          <div>
            <strong>${r.businessName || 'Attività'}</strong> · ${r.customer_name || 'Cliente'}
            <div class="review-meta">${r.created_at ? fmtDateLong(r.created_at.slice(0, 10)) : ''}</div>
          </div>
          <div class="flex items-center gap-2">
            ${starsHtml(r.rating)}
            <span class="badge badge-${r.status === 'approved' ? 'confirmed' : r.status === 'rejected' ? 'rejected' : 'pending'}">${r.status === 'approved' ? 'Approvata' : r.status === 'rejected' ? 'Rifiutata' : 'In attesa'}</span>
          </div>
        </div>
        ${r.comment ? `<div class="review-comment">${r.comment}</div>` : ''}
        <div class="flex gap-2 mt-3">
          ${r.status !== 'approved' ? `<button class="btn btn-outline btn-sm" data-approve="${r.id}">Approva</button>` : ''}
          ${r.status !== 'rejected' ? `<button class="btn btn-outline btn-sm" data-reject="${r.id}">Rifiuta</button>` : ''}
          <button class="btn btn-danger btn-sm" data-delete="${r.id}">Elimina</button>
        </div>
      </div>`).join('');

    reviewsTable.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => setReviewStatus(btn.dataset.approve, 'approved')));
    reviewsTable.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', () => setReviewStatus(btn.dataset.reject, 'rejected')));
    reviewsTable.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => removeReview(btn.dataset.delete)));
  }

  async function setReviewStatus(id, status) {
    await window.reservoAuth.updateReviewStatus(id, status);
    const r = allReviews.find(x => x.id === id);
    if (r) r.status = status;
    showToast(status === 'approved' ? 'Recensione approvata' : 'Recensione rifiutata', status === 'approved' ? 'success' : '');
    renderReviews(allReviews);
  }

  async function removeReview(id) {
    if (!confirm('Eliminare questa recensione?')) return;
    await window.reservoAuth.deleteReview(id);
    allReviews = allReviews.filter(x => x.id !== id);
    showToast('Recensione eliminata');
    renderReviews(allReviews);
  }

  businessSearch.addEventListener('input', () => renderBusinesses(allBusinesses));
  businessStatusFilter.addEventListener('change', () => renderBusinesses(allBusinesses));
  reviewStatusFilter.addEventListener('change', () => renderReviews(allReviews));

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

  function renderGrowthChart(users) {
    const counts = new Map();
    users.forEach(u => {
      const d = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate() : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const labels = Array.from(counts.keys()).sort();
    const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const niceLabels = labels.map(k => { const [y, m] = k.split('-'); return `${MONTHS[parseInt(m, 10) - 1]} ${y}`; });
    const data = labels.map(k => counts.get(k));

    if (growthChart) growthChart.destroy();
    growthChart = new Chart(document.getElementById('growthChart'), {
      type: 'bar',
      data: { labels: niceLabels, datasets: [{ label: 'Nuove attività registrate', data, backgroundColor: '#C9A227' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  async function refresh() {
    const [pending, businesses, gestori, bookingsCount, reviews] = await Promise.all([
      window.reservoAuth.listPendingAccounts(),
      window.reservoAuth.listAllBusinesses(),
      window.reservoAuth.listGestoreUsers().catch(() => []),
      window.reservoAuth.countAllBookings().catch(() => 0),
      window.reservoAuth.listAllReviews().catch(() => []),
    ]);
    allBusinesses = businesses;
    allReviews = reviews;
    renderPending(pending);
    renderBusinesses(allBusinesses);
    renderStats(businesses, bookingsCount);
    renderGrowthChart(gestori);
    renderReviews(allReviews);
  }

  function start() { refresh().catch(() => {
    pendingTable.innerHTML = '<div class="empty-state">Impossibile caricare le richieste al momento.</div>';
    businessTable.innerHTML = '';
    reviewsTable.innerHTML = '';
  }); }

  if (window.reservoAuth && window.reservoAuth.currentUser) start();
  else window.addEventListener('reservo-auth-ready', start, { once: true });
});

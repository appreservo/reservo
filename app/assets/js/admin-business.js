/* Reservo - pannello admin: dettaglio attività */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#logoutBtn, #logoutBtnMobile').forEach(btn => btn.addEventListener('click', () => window.reservoAuth.logout()));

  const uid = new URLSearchParams(location.search).get('uid');
  const loadingState = document.getElementById('loadingState');
  const form = document.getElementById('businessForm');
  const referenteCard = document.getElementById('referenteCard');
  const statusBadge = document.getElementById('businessStatusBadge');
  const toggleStatusBtn = document.getElementById('toggleStatusBtn');

  let currentStatus = 'active';

  function renderStatus(status) {
    currentStatus = status || 'active';
    if (currentStatus === 'rejected') {
      statusBadge.innerHTML = '<span class="badge badge-rejected">Rifiutata / Sospesa</span>';
      toggleStatusBtn.textContent = 'Riattiva attività';
    } else if (currentStatus === 'pending') {
      statusBadge.innerHTML = '<span class="badge badge-pending">In attesa</span>';
      toggleStatusBtn.textContent = 'Approva attività';
    } else {
      statusBadge.innerHTML = '<span class="badge badge-confirmed">Attiva</span>';
      toggleStatusBtn.textContent = 'Sospendi attività';
    }
  }

  async function load() {
    if (!uid) {
      loadingState.textContent = 'Attività non specificata.';
      return;
    }
    const [biz, profile] = await Promise.all([
      window.reservoAuth.getBusinessDirectory(uid),
      window.reservoAuth.getUserProfile(uid),
    ]);
    if (!biz && !profile) {
      loadingState.textContent = 'Attività non trovata.';
      return;
    }

    document.getElementById('businessTitle').textContent = (biz && biz.business_name) || (profile && profile.businessName) || 'Dettaglio attività';
    document.getElementById('businessName').value = (biz && biz.business_name) || (profile && profile.businessName) || '';
    document.getElementById('businessType').value = (biz && biz.type) || (profile && profile.businessType) || 'restaurant';
    document.getElementById('businessEmail').value = (biz && biz.email) || (profile && profile.email) || '';
    document.getElementById('businessSlug').value = (biz && biz.slug) || '';
    renderStatus(biz && biz.status);

    if (profile) {
      document.getElementById('referenteName').textContent = profile.name || '—';
      document.getElementById('referenteEmail').textContent = profile.email || '—';
      const d = profile.createdAt && profile.createdAt.toDate ? profile.createdAt.toDate() : null;
      document.getElementById('referenteCreatedAt').textContent = d ? fmtDateLong(d.toISOString().slice(0, 10)) : '—';
      referenteCard.classList.remove('hidden');
    }

    loadingState.classList.add('hidden');
    form.classList.remove('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    try {
      await window.reservoAuth.upsertBusinessDirectory(uid, {
        business_name: document.getElementById('businessName').value.trim(),
        type: document.getElementById('businessType').value,
        email: document.getElementById('businessEmail').value.trim(),
        slug: slugify(document.getElementById('businessSlug').value.trim()),
      });
      document.getElementById('businessTitle').textContent = document.getElementById('businessName').value.trim();
      showToast('Modifiche salvate', 'success');
    } finally {
      saveBtn.disabled = false;
    }
  });

  toggleStatusBtn.addEventListener('click', async () => {
    toggleStatusBtn.disabled = true;
    try {
      if (currentStatus === 'rejected' || currentStatus === 'pending') {
        await window.reservoAuth.approveAccount(uid);
        renderStatus('active');
        showToast('Attività riattivata', 'success');
      } else {
        if (!confirm('Sospendere questa attività? Non sarà più visibile pubblicamente.')) return;
        await window.reservoAuth.rejectAccount(uid);
        renderStatus('rejected');
        showToast('Attività sospesa');
      }
    } finally {
      toggleStatusBtn.disabled = false;
    }
  });

  function start() { load().catch(() => { loadingState.textContent = 'Impossibile caricare i dati.'; }); }

  if (window.reservoAuth && window.reservoAuth.currentUser) start();
  else window.addEventListener('reservo-auth-ready', start, { once: true });
});

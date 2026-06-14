(async function () {
  const data = await loadData();
  renderLayout('Recensioni', data);

  const businessUid = window.reservoAuth.getBusinessUid();
  let reviews = [];

  function render() {
    const filter = document.getElementById('filterStatus').value;
    const list = filter ? reviews.filter(r => r.status === filter) : reviews.slice();
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    const approved = reviews.filter(r => r.status === 'approved');
    const avg = approved.length ? (approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length) : 0;
    document.getElementById('statAvg').textContent = approved.length ? avg.toFixed(1) : '—';
    document.getElementById('statApproved').textContent = approved.length;
    document.getElementById('statPending').textContent = reviews.filter(r => r.status === 'pending').length;

    const container = document.getElementById('reviewsList');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessuna recensione da mostrare.</p></div>`;
      return;
    }
    container.innerHTML = list.map(r => `
      <div class="review-card">
        <div class="review-head">
          <div>
            <strong>${escapeHtml(r.customer_name || 'Cliente')}</strong>
            <div class="review-meta">${r.created_at ? fmtDateLong(r.created_at.slice(0, 10)) : ''}</div>
          </div>
          <div class="flex items-center gap-2">
            ${starsHtml(r.rating)}
            <span class="badge badge-${r.status === 'approved' ? 'confirmed' : r.status === 'rejected' ? 'rejected' : 'pending'}">${r.status === 'approved' ? 'Approvata' : r.status === 'rejected' ? 'Rifiutata' : 'In attesa'}</span>
          </div>
        </div>
        ${r.comment ? `<div class="review-comment">${escapeHtml(r.comment)}</div>` : ''}
        <div class="flex gap-2 mt-3">
          ${r.status !== 'approved' ? `<button class="btn btn-outline btn-sm" data-approve="${r.id}">Approva</button>` : ''}
          ${r.status !== 'rejected' ? `<button class="btn btn-outline btn-sm" data-reject="${r.id}">Rifiuta</button>` : ''}
          <button class="btn btn-danger btn-sm" data-delete="${r.id}">Elimina</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => setStatus(btn.dataset.approve, 'approved')));
    container.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', () => setStatus(btn.dataset.reject, 'rejected')));
    container.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => removeReview(btn.dataset.delete)));
  }

  async function setStatus(id, status) {
    await window.reservoAuth.updateReviewStatus(id, status);
    const r = reviews.find(x => x.id === id);
    if (r) r.status = status;
    showToast(status === 'approved' ? 'Recensione approvata' : 'Recensione rifiutata', status === 'approved' ? 'success' : '');
    render();
  }

  async function removeReview(id) {
    if (!confirm('Eliminare questa recensione?')) return;
    await window.reservoAuth.deleteReview(id);
    reviews = reviews.filter(x => x.id !== id);
    showToast('Recensione eliminata');
    render();
  }

  document.getElementById('filterStatus').addEventListener('change', render);

  try {
    reviews = await window.reservoAuth.getBusinessReviews(businessUid);
  } catch (e) {
    reviews = [];
  }
  render();
})();

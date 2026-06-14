(async function () {
  const data = await loadData();
  renderLayout('Comunicazioni', data);

  const businessUid = window.reservoAuth.getBusinessUid();
  const businessName = data.profile?.business_name || '';

  function statusLabelBroadcast(status) {
    if (status === 'sent') return 'Inviata';
    if (status === 'pending') return 'In elaborazione';
    return status || '';
  }

  function fmtSentAt(b) {
    const ts = b.created_at;
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('it-IT');
    }
    return '';
  }

  async function renderList() {
    const list = document.getElementById('broadcastsList');
    let broadcasts = [];
    try {
      broadcasts = await window.reservoAuth.getBusinessBroadcasts(businessUid);
    } catch (err) {
      console.error(err);
    }
    if (broadcasts.length === 0) {
      list.innerHTML = `<div class="empty-state"><p>Non hai ancora inviato comunicazioni.</p></div>`;
      return;
    }
    broadcasts.sort((a, b) => fmtSentAt(b).localeCompare(fmtSentAt(a)));
    list.innerHTML = `<table><thead><tr><th>Data</th><th>Oggetto</th><th>Stato</th><th>Destinatari</th></tr></thead><tbody>` +
      broadcasts.map(b => `<tr>
        <td data-label="Data">${fmtSentAt(b)}</td>
        <td data-label="Oggetto">${escapeHtml(b.subject || '')}</td>
        <td data-label="Stato"><span class="badge badge-${b.status === 'sent' ? 'confirmed' : 'pending'}">${statusLabelBroadcast(b.status)}</span></td>
        <td data-label="Destinatari">${b.sent_count != null ? b.sent_count : '—'}</td>
      </tr>`).join('') + `</tbody></table>`;
  }

  document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('bSubject').value.trim();
    const message = document.getElementById('bMessage').value.trim();
    if (!subject || !message) return;

    if (!confirm('Inviare questa comunicazione a tutti i clienti della tua attività?')) return;

    try {
      await window.reservoAuth.createBroadcast({ businessUid, businessName, subject, message });
      showToast('Comunicazione inviata, sarà elaborata entro pochi minuti', 'success');
      document.getElementById('broadcastForm').reset();
      renderList();
    } catch (err) {
      console.error(err);
      showToast('Errore durante l\'invio', 'error');
    }
  });

  renderList();
})();

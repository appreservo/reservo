/* Reservo - area cliente: ricerca attività + elenco prenotazioni (placeholder) */
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('businessList');
  const searchInput = document.getElementById('searchInput');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => {
    window.reservoAuth.logout();
  });

  let businesses = [];

  function render(filter) {
    const term = (filter || '').trim().toLowerCase();
    const filtered = !term ? businesses : businesses.filter(b => {
      return [b.business_name, typeLabel(b.type), b.address, b.description]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(term));
    });

    if (!filtered.length) {
      listEl.innerHTML = '<div class="empty-state">Nessuna attività trovata.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(b => `
      <a class="card" href="sito.html?b=${encodeURIComponent(b.slug)}" style="text-decoration:none; color:inherit; display:block">
        <div class="card-header">
          <h3>${escapeHtml(b.business_name || 'Attività')}</h3>
          <span class="badge badge-navy">${typeLabel(b.type)}</span>
        </div>
        ${b.address ? `<p class="text-mid small mb-3">${escapeHtml(b.address)}</p>` : ''}
        ${b.description ? `<p class="small">${escapeHtml(b.description)}</p>` : ''}
      </a>
    `).join('');
  }

  searchInput.addEventListener('input', () => render(searchInput.value));

  window.reservoAuth.listBusinesses().then(list => {
    businesses = list;
    render('');
  }).catch(() => {
    listEl.innerHTML = '<div class="empty-state">Impossibile caricare le attività al momento.</div>';
  });

  // ---------- le mie prenotazioni ----------
  const myBookingsEl = document.getElementById('myBookings');
  const loyaltyEl = document.getElementById('loyaltyList');
  const reviewModal = document.getElementById('reviewModal');
  let currentUser = null;
  let myReviews = [];

  function isReviewable(b) {
    return b.status === 'confirmed' && b.date < todayStr() && b.businessUid &&
      !myReviews.some(r => r.bookingId === b.id);
  }

  function renderBookings(list) {
    if (!list.length) {
      myBookingsEl.innerHTML = '<div class="empty-state">Non hai ancora effettuato prenotazioni.</div>';
      return;
    }
    const sorted = list.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    myBookingsEl.innerHTML = sorted.map(b => `
      <div class="card">
        <div class="card-header">
          <h3>${escapeHtml(b.businessName || 'Attività')}</h3>
          <span class="badge badge-${b.status}">${statusLabel(b.status)}</span>
        </div>
        <p class="small">${fmtDateLong(b.date)} — ore ${b.time}</p>
        <p class="text-mid small">${escapeHtml(b.service_name || '')} · ${b.party_size} ${b.party_size === 1 ? 'persona' : 'persone'}</p>
        ${b.reference ? `<p class="text-mid small">${escapeHtml(b.reference)}</p>` : ''}
        <div class="flex gap-2 mt-3">
          ${(b.status === 'pending' || b.status === 'confirmed') ? `<button class="btn btn-outline btn-sm" data-cancel="${b.id}">Annulla prenotazione</button>` : ''}
          ${isReviewable(b) ? `<button class="btn btn-gold btn-sm" data-review="${b.id}">Lascia una recensione</button>` : ''}
        </div>
      </div>
    `).join('');

    myBookingsEl.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      await window.reservoAuth.updateBookingStatus(btn.dataset.cancel, 'cancelled');
      loadBookings();
    }));
    myBookingsEl.querySelectorAll('[data-review]').forEach(btn => btn.addEventListener('click', () => {
      openReviewModal(sorted.find(b => b.id === btn.dataset.review));
    }));
  }

  // ---------- recensione ----------
  let reviewBooking = null;
  let reviewRating = 0;

  function renderReviewStars() {
    document.getElementById('reviewStars').innerHTML = starsHtml(reviewRating, false);
    document.querySelectorAll('#reviewStars .star').forEach(star => star.addEventListener('click', () => {
      reviewRating = parseInt(star.dataset.value, 10);
      document.getElementById('reviewRating').value = reviewRating;
      renderReviewStars();
    }));
  }

  function openReviewModal(booking) {
    reviewBooking = booking;
    reviewRating = 0;
    document.getElementById('reviewBusinessName').textContent = booking.businessName || 'Attività';
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = 0;
    renderReviewStars();
    reviewModal.classList.add('open');
  }

  document.getElementById('reviewSubmitBtn').addEventListener('click', async () => {
    if (!reviewRating) { showToast('Seleziona una valutazione', 'error'); return; }
    const btn = document.getElementById('reviewSubmitBtn');
    btn.disabled = true;
    try {
      await window.reservoAuth.createReview({
        businessUid: reviewBooking.businessUid,
        businessName: reviewBooking.businessName || '',
        bookingId: reviewBooking.id,
        customerUid: currentUser.uid,
        customer_name: reviewBooking.customer_name || currentUser.email,
        rating: reviewRating,
        comment: document.getElementById('reviewComment').value.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      myReviews.push({ bookingId: reviewBooking.id });
      reviewModal.classList.remove('open');
      showToast('Grazie per la tua recensione!', 'success');
      loadBookings();
    } catch (e) {
      showToast('Invio non riuscito, riprova.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').classList.remove('open');
  }));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => {
    if (e.target === ov) ov.classList.remove('open');
  }));

  // ---------- punti fedeltà ----------
  async function renderLoyalty(list) {
    const completed = list.filter(b => b.status === 'confirmed' && b.date < todayStr() && b.businessUid);
    const byBusiness = new Map();
    completed.forEach(b => {
      if (!byBusiness.has(b.businessUid)) byBusiness.set(b.businessUid, { name: b.businessName || 'Attività', count: 0 });
      byBusiness.get(b.businessUid).count++;
    });
    if (byBusiness.size === 0) {
      loyaltyEl.innerHTML = '<div class="empty-state">Completa delle prenotazioni per iniziare ad accumulare punti.</div>';
      return;
    }
    const entries = await Promise.all(Array.from(byBusiness.entries()).map(async ([businessUid, info]) => {
      let pointsPerBooking = 10;
      try {
        const pub = await window.reservoAuth.getPublicBusinessData(businessUid);
        if (pub && pub.profile && pub.profile.loyalty_points_per_booking != null) {
          pointsPerBooking = pub.profile.loyalty_points_per_booking;
        }
      } catch (e) {}
      return { name: info.name, points: info.count * pointsPerBooking };
    }));
    loyaltyEl.innerHTML = entries.map(e => `
      <div class="card stat-card">
        <div class="stat-label">${escapeHtml(e.name)}</div>
        <div class="stat-value">${e.points} <span class="small text-mid">punti</span></div>
      </div>
    `).join('');
  }

  function loadBookings() {
    window.reservoAuth.whoAmI().then(async user => {
      if (!user) return;
      currentUser = user;
      try {
        const [bookings, reviews] = await Promise.all([
          window.reservoAuth.getCustomerBookings(user.uid),
          window.reservoAuth.getCustomerReviews(user.uid),
        ]);
        myReviews = reviews;
        renderBookings(bookings);
        renderLoyalty(bookings);
      } catch (e) {
        myBookingsEl.innerHTML = '<div class="empty-state">Impossibile caricare le prenotazioni al momento.</div>';
      }
    });
  }

  loadBookings();
});

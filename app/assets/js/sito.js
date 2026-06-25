import { getBusinessBySlug, getPublicBusinessData, createPublicBooking, getBusinessBookingsForDate, getApprovedReviews, whoAmI } from './auth.js';

(async function () {
  const slug = new URLSearchParams(location.search).get('b');
  const isPublicMode = !!slug;
  let data;
  let business = null;

  if (isPublicMode) {
    business = await getBusinessBySlug(slug);
    data = business && await getPublicBusinessData(business.id);
    if (!data) {
      document.body.innerHTML = `<div class="demo-banner">Attività non trovata.</div>`;
      return;
    }
    document.querySelector('.demo-banner').remove();
    // ricerca prenotazioni per contatto: richiede dati privati non disponibili sul sito pubblico,
    // usare "Le mie prenotazioni" nell'area cliente per gli utenti registrati
    document.getElementById('cerca').classList.add('hidden');
    document.querySelector('a[href="#cerca"]').classList.add('hidden');
    // QR code: serve al gestore per stampare/scaricare, non al cliente sul sito pubblico
    document.getElementById('qr').classList.add('hidden');
    document.querySelector('a[href="#qr"]').classList.add('hidden');
  } else {
    data = await loadData();
  }

  const p = data.profile;
  const isRestaurant = p.type === 'restaurant';
  // Stesso criterio usato nel form admin (prenotazioni.js): per i ristoranti
  // con tavoli attivi la capacità è il numero di tavoli adatti; per i
  // ristoranti senza tavoli non c'è alcun limite di sovrapposizione (vedi
  // getAvailableSlots); per le altre attività è il numero di persone in
  // staff (o 1 se il servizio è assegnato a una persona specifica).
  const hasTablesFeature = isRestaurant && !(p.hidden_features || []).includes('tables');
  const staffCount = isPublicMode ? Math.max(1, data.staffCount || 1) : Math.max(1, (data.staff || []).length);
  const menuLabel = isRestaurant ? 'Menu' : 'Listino prezzi';
  document.getElementById('navMenuLink').textContent = menuLabel;
  document.getElementById('menuSectionTitle').textContent = menuLabel;
  document.getElementById('qrDescription').textContent = `Stampa questo QR code e mettilo in vetrina o sui tavoli: i clienti potranno consultare ${isRestaurant ? 'il menu' : 'il listino prezzi'} e prenotare direttamente da smartphone.`;
  let businessUid = business ? business.id : null;
  if (!businessUid) {
    const user = await whoAmI();
    businessUid = user ? user.uid : null;
  }

  // ---------- header / hero / footer ----------
  document.getElementById('brandName').textContent = p.business_name;
  document.getElementById('heroName').textContent = p.business_name;
  document.getElementById('heroDesc').textContent = p.description || '';
  document.getElementById('heroAddress').textContent = p.address ? '📍 ' + p.address : '';
  document.getElementById('heroPhone').textContent = p.phone ? '📞 ' + p.phone : '';
  document.getElementById('footerName').textContent = p.business_name;
  document.getElementById('footerAddress').textContent = p.address || '';
  document.getElementById('footerContacts').textContent = [p.phone, p.email].filter(Boolean).join(' · ');
  document.title = p.business_name + ' · Reservo';

  // ---------- open/closed status ----------
  function computeStatus() {
    const now = new Date();
    const jsDay = now.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1; // 0=Lun..6=Dom
    const h = data.hours.find(x => x.day === ourDay);
    const todayClosed = data.closures.some(c => c.date === todayStr());
    if (!h || h.closed || todayClosed) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = h.open.split(':').map(Number);
    const [ch, cm] = h.close.split(':').map(Number);
    const open = oh * 60 + om, close = ch * 60 + cm;
    if (close <= open) return cur >= open || cur < close; // overnight
    return cur >= open && cur < close;
  }
  const isOpen = computeStatus();
  const badge = document.getElementById('statusBadge');
  badge.textContent = isOpen ? 'Aperto ora' : 'Chiuso ora';
  badge.className = 'status-badge ' + (isOpen ? 'status-open' : 'status-closed');

  // ---------- mobile nav ----------
  let navOverlay = document.getElementById('navOverlay');
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.id = 'navOverlay';
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
  }

  function setNavOpen(open) {
    document.getElementById('siteNav').classList.toggle('open', open);
    navOverlay.classList.toggle('open', open);
  }

  document.getElementById('navBurger').addEventListener('click', () => {
    setNavOpen(!document.getElementById('siteNav').classList.contains('open'));
  });
  navOverlay.addEventListener('click', () => setNavOpen(false));
  document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => {
    setNavOpen(false);
  }));

  // ---------- menu ----------
  function renderMenu() {
    const container = document.getElementById('menuContainer');
    const items = data.menu.filter(i => i.available !== false);
    if (items.length === 0) {
      container.innerHTML = `<p class="text-mid" style="text-align:center">${isRestaurant ? 'Il menu' : 'Il listino prezzi'} non è ancora disponibile.</p>`;
      return;
    }
    const groups = new Map();
    items.forEach(i => {
      if (!groups.has(i.category)) groups.set(i.category, []);
      groups.get(i.category).push(i);
    });
    let html = '';
    groups.forEach((list, cat) => {
      html += `<div class="menu-category"><h3>${escapeHtml(cat)}</h3><div class="menu-grid">`;
      list.forEach(item => {
        html += `<div class="menu-card">
          ${item.photo ? `<img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" loading="lazy">` : ''}
          <div class="body">
            <h4>${escapeHtml(item.name)} <span>${euro(item.price)}</span></h4>
            <div class="desc">${escapeHtml(item.description || '')}</div>
            <div class="tags">${(item.allergens || []).map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')}</div>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  }
  renderMenu();

  // ---------- booking form (wizard) ----------
  const BOOKING_MIN_NOTICE_HOURS = 2;
  const BOOKING_ADVANCE_DAYS = 30;

  const bookingForm = document.getElementById('bookingForm');
  const bookingState = { step: 1, serviceId: null, partySize: 1, date: '', time: '', coupon: null };

  function goToStep(step) {
    bookingState.step = step;
    bookingForm.querySelectorAll('.booking-step').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.step) === step);
    });
    document.querySelectorAll('#bookingSteps .step').forEach(el => {
      const n = Number(el.dataset.step);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });
    if (step === 3) renderBookingSummary();
  }

  // --- step 1: servizio + persone ---
  function renderServiceCards() {
    const container = document.getElementById('serviceCards');
    const services = data.services || [];
    if (services.length === 0) {
      container.innerHTML = `<p class="text-mid">Nessun servizio disponibile al momento.</p>`;
      return;
    }
    container.innerHTML = services.map(s => `
      <div class="service-card" data-service="${s.id}">
        <span class="name">${escapeHtml(s.name)}</span>
        <span class="meta">${s.duration} min${s.price ? ' · ' + euro(s.price) : ''}</span>
      </div>`).join('');
    container.querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => {
      bookingState.serviceId = card.dataset.service;
      bookingState.date = '';
      bookingState.time = '';
      document.getElementById('cDate').value = '';
      document.getElementById('slotGrid').innerHTML = '';
      document.getElementById('slotMessage').textContent = '';
      document.getElementById('step2Next').disabled = true;
      container.querySelectorAll('.service-card').forEach(c => c.classList.toggle('selected', c === card));
    }));
    if (services.length === 1) {
      bookingState.serviceId = services[0].id;
      container.querySelector('.service-card').classList.add('selected');
    }
  }
  renderServiceCards();

  document.querySelector('[data-next="2"]').addEventListener('click', () => {
    if (!bookingState.serviceId) { showToast('Seleziona un servizio', 'error'); return; }
    bookingState.partySize = parseInt(document.getElementById('cParty').value, 10) || 1;
    const minDate = fmtDate(new Date(Date.now() + BOOKING_MIN_NOTICE_HOURS * 3600 * 1000));
    const maxDate = fmtDate(addDays(new Date(), BOOKING_ADVANCE_DAYS));
    const dateInput = document.getElementById('cDate');
    dateInput.min = minDate;
    dateInput.max = maxDate;
    goToStep(2);
  });

  // --- step 2: data + slot ---
  async function getAvailableSlots(dateStr) {
    const service = (data.services || []).find(s => s.id === bookingState.serviceId);
    if (!service) return [];

    const date = new Date(dateStr + 'T00:00:00');
    const jsDay = date.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;
    const hours = data.hours.find(h => h.day === ourDay);
    if (!hours || hours.closed || !hours.open || !hours.close) return [];
    if (data.closures.some(c => c.date === dateStr)) return [];

    const minNotice = new Date(Date.now() + BOOKING_MIN_NOTICE_HOURS * 3600 * 1000);
    const duration = service.duration || 90;

    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    let openMin = oh * 60 + om;
    let closeMin = ch * 60 + cm;
    if (closeMin <= openMin) closeMin += 24 * 60; // overnight

    function assignedStaffIds(svc) {
      if (!svc) return [];
      if (Array.isArray(svc.staff_ids)) return svc.staff_ids;
      return svc.staff_id ? [svc.staff_id] : [];
    }
    function staffSetKey(ids) {
      return ids.length ? ids.slice().sort().join(',') : '';
    }

    const candidateStaffIds = hasTablesFeature ? [] : assignedStaffIds(service);
    const candidateSetKey = staffSetKey(candidateStaffIds);

    let capacity = 1;
    if (hasTablesFeature) {
      const suitableTables = (data.tables || []).filter(t => t.capacity >= bookingState.partySize);
      if (suitableTables.length === 0) return [];
      capacity = suitableTables.length;
    } else if (isRestaurant) {
      // Ristorante senza tavoli: nessun limite di capacità, le prenotazioni
      // possono accavallarsi liberamente (l'attività le confermerà a mano).
      capacity = Infinity;
    } else {
      capacity = candidateStaffIds.length ? candidateStaffIds.length : staffCount;
    }

    let existing = data.bookings.filter(b => b.date === dateStr && (b.status === 'confirmed' || b.status === 'pending'));
    if (isPublicMode) {
      const liveBookings = await getBusinessBookingsForDate(business.id, dateStr);
      existing = existing.concat(liveBookings);
    }

    function existingService(b) {
      return (data.services || []).find(s => s.id === b.service_id);
    }
    // Durata di una prenotazione esistente (dal suo servizio, se presente).
    function existingBookingDuration(b) {
      const svc = existingService(b);
      return (svc && svc.duration) || duration;
    }
    // Confronto per sovrapposizione di intervalli, non solo per orario di inizio
    // identico: una prenotazione da 45 min deve bloccare tutta la sua finestra,
    // non solo lo slot che inizia esattamente alla stessa ora.
    function overlaps(startA, durA, startB, durB) {
      return startA < startB + durB && startB < startA + durA;
    }
    // Stesso criterio del form admin: due servizi competono per la stessa
    // risorsa solo se assegnati esattamente allo stesso gruppo di persone
    // (gruppo vuoto incluso = "chiunque in staff").
    function competesForSameResource(b) {
      return staffSetKey(assignedStaffIds(existingService(b))) === candidateSetKey;
    }

    const slots = [];
    for (let t = openMin; t + duration <= closeMin; t += duration) {
      const slotStart = new Date(date);
      slotStart.setMinutes(slotStart.getMinutes() + t);
      if (slotStart <= minNotice) continue;
      const hh = String(Math.floor(t / 60) % 24).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const overlapCount = existing.filter(b => {
        const [bh, bm] = b.time.split(':').map(Number);
        if (!overlaps(t, duration, bh * 60 + bm, existingBookingDuration(b))) return false;
        return hasTablesFeature || (!isRestaurant && competesForSameResource(b));
      }).length;
      slots.push({ time: timeStr, available: overlapCount < capacity });
    }
    return slots;
  }

  async function renderSlots() {
    const grid = document.getElementById('slotGrid');
    const msg = document.getElementById('slotMessage');
    bookingState.time = '';
    document.getElementById('step2Next').disabled = true;

    const dateStr = document.getElementById('cDate').value;
    bookingState.date = dateStr;
    if (!dateStr) { grid.innerHTML = ''; msg.textContent = ''; return; }

    const slots = await getAvailableSlots(dateStr);
    if (slots.length === 0) {
      grid.innerHTML = '';
      msg.textContent = 'Nessun orario disponibile per la data scelta. Prova con un altro giorno.';
      return;
    }
    msg.textContent = '';
    grid.innerHTML = slots.map(s =>
      `<button type="button" class="slot-btn" data-time="${s.time}" ${s.available ? '' : 'disabled'}>${s.time}</button>`).join('');

    grid.querySelectorAll('.slot-btn:not(:disabled)').forEach(btn => btn.addEventListener('click', () => {
      bookingState.time = btn.dataset.time;
      grid.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('selected', b === btn));
      document.getElementById('step2Next').disabled = false;
    }));
  }
  document.getElementById('cDate').addEventListener('change', renderSlots);

  document.querySelector('[data-next="3"]').addEventListener('click', () => {
    if (!bookingState.date || !bookingState.time) { showToast('Seleziona data e orario', 'error'); return; }
    goToStep(3);
  });

  // --- step 3: riepilogo + dati cliente ---
  function renderBookingSummary() {
    const service = (data.services || []).find(s => s.id === bookingState.serviceId);
    document.getElementById('bookingSummary').innerHTML = `
      <div><strong>${escapeHtml(service ? service.name : '')}</strong> · ${bookingState.partySize} ${bookingState.partySize === 1 ? 'persona' : 'persone'}</div>
      <div>${fmtDateLong(bookingState.date)} — ore ${bookingState.time}</div>
    `;
  }

  // --- coupon ---
  function couponDiscountLabel(coupon) {
    return coupon.type === 'percent' ? `-${coupon.value}%` : `-${euro(coupon.value)}`;
  }

  document.getElementById('couponBtn').addEventListener('click', () => {
    const code = document.getElementById('cCoupon').value.trim().toUpperCase();
    const msg = document.getElementById('couponMessage');
    if (!code) { msg.textContent = ''; msg.className = 'small'; bookingState.coupon = null; return; }
    const coupon = (data.coupons || []).find(c => (c.code || '').toUpperCase() === code);
    const today = todayStr();
    const valid = coupon && coupon.active !== false
      && (!coupon.valid_from || coupon.valid_from <= today)
      && (!coupon.valid_to || coupon.valid_to >= today)
      && (!coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses);
    if (!valid) {
      bookingState.coupon = null;
      msg.textContent = 'Codice non valido o scaduto.';
      msg.className = 'small error';
      return;
    }
    bookingState.coupon = coupon;
    msg.textContent = `Codice applicato: sconto ${couponDiscountLabel(coupon)}.`;
    msg.className = 'small ok';
  });

  // --- back buttons ---
  bookingForm.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', () => {
    goToStep(Number(btn.dataset.prev));
  }));

  // --- generate booking reference ---
  function generateBookingReference() {
    const today = todayStr().replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000);
    return `RZ-${today}-${String(rand).padStart(4, '0')}`;
  }

  // --- step 4: submit ---
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const service = (data.services || []).find(s => s.id === bookingState.serviceId);
    const booking = {
      id: uid(),
      reference: generateBookingReference(),
      customer_name: document.getElementById('cName').value.trim(),
      party_size: bookingState.partySize,
      email: document.getElementById('cEmail').value.trim(),
      phone: document.getElementById('cPhone').value.trim(),
      date: bookingState.date,
      time: bookingState.time,
      service_id: bookingState.serviceId,
      service_name: service ? service.name : '',
      notes: document.getElementById('cNotes').value.trim(),
      status: p.booking_mode === 'auto' ? 'confirmed' : 'pending',
      created_at: new Date().toISOString(),
    };
    if (bookingState.coupon) {
      booking.coupon_code = bookingState.coupon.code;
      booking.coupon_discount = couponDiscountLabel(bookingState.coupon);
    }

    if (isPublicMode) {
      const user = await whoAmI();
      await createPublicBooking({
        ...booking,
        businessUid: business.id,
        businessName: p.business_name,
        businessSlug: p.slug,
        customerUid: user ? user.uid : null,
      });
    } else {
      data.bookings.push(booking);
      saveData(data);
    }

    const confirmedMsg = `<div class="alert alert-success">Prenotazione confermata! Riceverai una email di conferma a ${booking.email}.</div>`;
    const pendingMsg = `<div class="alert alert-info">Richiesta inviata! Il gestore confermerà la tua prenotazione a breve via email.</div>`;

    document.getElementById('bookingConfirmation').innerHTML = `
      <div class="booking-ref">${escapeHtml(booking.reference)}</div>
      ${booking.status === 'confirmed' ? confirmedMsg : pendingMsg}
      <div class="booking-summary">
        <div><strong>${escapeHtml(booking.service_name)}</strong> · ${booking.party_size} ${booking.party_size === 1 ? 'persona' : 'persone'}</div>
        <div>${fmtDateLong(booking.date)} — ore ${booking.time}</div>
        <div>${escapeHtml(booking.customer_name)}</div>
        ${booking.coupon_code ? `<div>Coupon ${booking.coupon_code} applicato (${booking.coupon_discount})</div>` : ''}
      </div>
      <p class="text-mid small">Conserva il codice prenotazione: ti servirà per cercarla nella sezione "Le mie prenotazioni".</p>
    `;
    goToStep(4);
  });

  document.getElementById('newBookingBtn').addEventListener('click', () => {
    bookingForm.reset();
    document.getElementById('cParty').value = 1;
    document.getElementById('couponMessage').textContent = '';
    document.getElementById('couponMessage').className = 'small';
    bookingState.serviceId = null;
    bookingState.date = '';
    bookingState.time = '';
    bookingState.coupon = null;
    document.getElementById('slotGrid').innerHTML = '';
    document.getElementById('slotMessage').textContent = '';
    document.querySelectorAll('#serviceCards .service-card').forEach(c => c.classList.remove('selected'));
    renderServiceCards();
    goToStep(1);
  });

  goToStep(1);

  // ---------- search bookings ----------
  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchContact').value.trim().toLowerCase();
    const results = document.getElementById('searchResults');
    if (!q) { results.innerHTML = ''; return; }
    const matches = data.bookings.filter(b =>
      (b.email && b.email.toLowerCase() === q) || (b.phone && b.phone.toLowerCase() === q));
    if (matches.length === 0) {
      results.innerHTML = `<p class="text-mid">Nessuna prenotazione trovata per questo contatto.</p>`;
      return;
    }
    matches.sort((a,b) => b.date.localeCompare(a.date));
    results.innerHTML = matches.map(b => `
      <div class="event-card">
        <div class="meta">${fmtDateLong(b.date)} — ore ${b.time}</div>
        ${b.reference ? `<div class="text-mid small">${escapeHtml(b.reference)}</div>` : ''}
        <div>${escapeHtml(b.customer_name)} · ${b.party_size} persone</div>
        <div style="margin:.4rem 0"><span class="tag" style="background:rgba(27,47,110,.08); color:var(--primary)">${statusLabel(b.status)}</span></div>
        ${(b.status === 'pending' || b.status === 'confirmed') ? `<button class="btn btn-outline" data-cancel="${b.id}" style="width:auto; padding:.4rem .9rem; font-size:.8rem">Annulla prenotazione</button>` : ''}
      </div>`).join('');

    results.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', () => {
      const b = data.bookings.find(x => x.id === btn.dataset.cancel);
      b.status = 'cancelled';
      saveData(data);
      document.getElementById('searchBtn').click();
    }));
  });

  // ---------- events ----------
  function renderEvents() {
    const container = document.getElementById('eventsContainer');
    const upcoming = data.events.filter(e => e.date >= todayStr()).sort((a,b) => a.date.localeCompare(b.date));
    if (upcoming.length === 0) {
      container.innerHTML = `<p class="text-mid" style="text-align:center">Nessun evento in programma al momento.</p>`;
      return;
    }
    container.innerHTML = upcoming.map(ev => {
      const taken = ev.taken !== undefined ? ev.taken : (ev.registrations || []).reduce((s,r) => s + (r.people || 1), 0);
      const left = ev.max_participants - taken;
      const full = left <= 0;
      const waitlistCount = (ev.waitlist || []).length;
      return `<div class="event-card">
        <h3>${escapeHtml(ev.title)}</h3>
        <div class="meta">${fmtDateLong(ev.date)} — ore ${ev.time}${ev.location ? ' · ' + escapeHtml(ev.location) : ''}</div>
        <div class="desc">${escapeHtml(ev.description || '')}</div>
        <div class="spots">${!full ? left + ' posti disponibili su ' + ev.max_participants : 'Posti esauriti' + (waitlistCount ? ` · ${waitlistCount} in lista d'attesa` : '')}</div>
        ${!isPublicMode ? `<button class="btn btn-gold" data-join="${ev.id}" style="width:auto; padding:.5rem 1.2rem; font-size:.85rem">${full ? "Iscriviti in lista d'attesa" : 'Iscriviti'}</button>
        <div class="join-form" id="join-${ev.id}" style="display:none; margin-top:1rem">
          <div class="field-row">
            <div><label>Nome</label><input type="text" id="jn-${ev.id}"></div>
            <div><label>Persone</label><input type="number" min="1" value="1" id="jp-${ev.id}"></div>
          </div>
          <div class="field-row">
            <div><label>Email</label><input type="email" id="je-${ev.id}"></div>
            <div><label>Telefono</label><input type="text" id="jt-${ev.id}"></div>
          </div>
          <button class="btn btn-gold" data-confirm-join="${ev.id}" data-waitlist="${full}">${full ? "Conferma iscrizione in lista d'attesa" : 'Conferma iscrizione'}</button>
        </div>` : ''}
      </div>`;
    }).join('');

    container.querySelectorAll('[data-join]').forEach(btn => btn.addEventListener('click', () => {
      document.getElementById('join-' + btn.dataset.join).style.display = 'block';
    }));
    container.querySelectorAll('[data-confirm-join]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.confirmJoin;
      const ev = data.events.find(e => e.id === id);
      const name = document.getElementById('jn-' + id).value.trim();
      if (!name) { showToast('Inserisci il tuo nome', 'error'); return; }
      const entry = {
        id: uid(),
        name,
        email: document.getElementById('je-' + id).value.trim(),
        phone: document.getElementById('jt-' + id).value.trim(),
        people: parseInt(document.getElementById('jp-' + id).value, 10) || 1,
        created_at: new Date().toISOString(),
      };
      if (btn.dataset.waitlist === 'true') {
        ev.waitlist = ev.waitlist || [];
        ev.waitlist.push(entry);
        showToast("Iscrizione in lista d'attesa registrata, ti contatteremo se si libera un posto.", 'success');
      } else {
        ev.registrations = ev.registrations || [];
        ev.registrations.push(entry);
        showToast('Iscrizione registrata, a presto!', 'success');
      }
      saveData(data);
      renderEvents();
    }));
  }
  renderEvents();

  // ---------- recensioni ----------
  async function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!businessUid) { container.innerHTML = ''; return; }
    let reviews = [];
    try {
      reviews = await getApprovedReviews(businessUid);
    } catch (e) {}
    if (reviews.length === 0) {
      container.innerHTML = `<p class="text-mid" style="text-align:center">Nessuna recensione pubblicata al momento.</p>`;
      return;
    }
    reviews.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    container.innerHTML = `
      <div class="review-summary">
        <div class="score">${avg.toFixed(1)}</div>
        ${starsHtml(avg)}
        <div class="text-mid small">${reviews.length} recensioni</div>
      </div>` +
      reviews.map(r => `
        <div class="review-card">
          <div class="review-head">
            <span class="review-author">${escapeHtml(r.customer_name || 'Cliente')}</span>
            ${starsHtml(r.rating)}
          </div>
          <div class="review-date">${r.created_at ? fmtDateLong(r.created_at.slice(0, 10)) : ''}</div>
          ${r.comment ? `<div class="review-comment">${escapeHtml(r.comment)}</div>` : ''}
        </div>`).join('');
  }
  renderReviews();

  // ---------- footer hours ----------
  document.getElementById('hoursTable').innerHTML = data.hours.map(h =>
    `<div><span>${DAYS[h.day]}</span><span>${h.closed ? 'Chiuso' : h.open + ' - ' + h.close}</span></div>`).join('');

  // ---------- QR code ----------
  const qrUrl = location.href.split('#')[0];
  new QRCode(document.getElementById('qrcode'), {
    text: qrUrl,
    width: 200,
    height: 200,
    colorDark: '#1B2F6E',
    colorLight: '#ffffff',
  });

  document.getElementById('downloadQr').addEventListener('click', () => {
    const canvas = document.querySelector('#qrcode canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qrcode-' + (p.slug || 'reservo') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // toast (no layout.js loaded here, define inline if missing)
  if (typeof showToast !== 'function') window.showToast = () => {};
})();

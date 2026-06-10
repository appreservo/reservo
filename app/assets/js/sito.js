(function () {
  const data = loadData();
  const p = data.profile;

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
  document.getElementById('navBurger').addEventListener('click', () => {
    document.getElementById('siteNav').classList.toggle('open');
  });
  document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => {
    document.getElementById('siteNav').classList.remove('open');
  }));

  // ---------- menu ----------
  function renderMenu() {
    const container = document.getElementById('menuContainer');
    const items = data.menu.filter(i => i.available !== false);
    if (items.length === 0) {
      container.innerHTML = `<p class="text-mid" style="text-align:center">Il menu non è ancora disponibile.</p>`;
      return;
    }
    const groups = new Map();
    items.forEach(i => {
      if (!groups.has(i.category)) groups.set(i.category, []);
      groups.get(i.category).push(i);
    });
    let html = '';
    groups.forEach((list, cat) => {
      html += `<div class="menu-category"><h3>${cat}</h3><div class="menu-grid">`;
      list.forEach(item => {
        html += `<div class="menu-card">
          ${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : ''}
          <div class="body">
            <h4>${item.name} <span>${euro(item.price)}</span></h4>
            <div class="desc">${item.description || ''}</div>
            <div class="tags">${(item.allergens || []).map(a => `<span class="tag">${a}</span>`).join('')}</div>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  }
  renderMenu();

  // ---------- booking form ----------
  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const booking = {
      id: uid(),
      customer_name: document.getElementById('cName').value.trim(),
      party_size: parseInt(document.getElementById('cParty').value, 10) || 1,
      email: document.getElementById('cEmail').value.trim(),
      phone: document.getElementById('cPhone').value.trim(),
      date: document.getElementById('cDate').value,
      time: document.getElementById('cTime').value,
      notes: document.getElementById('cNotes').value.trim(),
      status: p.booking_mode === 'auto' ? 'confirmed' : 'pending',
      created_at: new Date().toISOString(),
    };
    data.bookings.push(booking);
    saveData(data);

    const alertEl = document.getElementById('bookingAlert');
    if (booking.status === 'confirmed') {
      alertEl.innerHTML = `<div class="alert alert-success">Prenotazione confermata! Riceverai una email di conferma a ${booking.email}.</div>`;
    } else {
      alertEl.innerHTML = `<div class="alert alert-info">Richiesta inviata! Il gestore confermerà la tua prenotazione a breve via email.</div>`;
    }
    document.getElementById('bookingForm').reset();
    document.getElementById('cParty').value = 2;
  });

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
        <div>${b.customer_name} · ${b.party_size} persone</div>
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
      const taken = (ev.registrations || []).reduce((s,r) => s + (r.people || 1), 0);
      const left = ev.max_participants - taken;
      return `<div class="event-card">
        <h3>${ev.title}</h3>
        <div class="meta">${fmtDateLong(ev.date)} — ore ${ev.time}${ev.location ? ' · ' + ev.location : ''}</div>
        <div class="desc">${ev.description || ''}</div>
        <div class="spots">${left > 0 ? left + ' posti disponibili su ' + ev.max_participants : 'Posti esauriti'}</div>
        ${left > 0 ? `<button class="btn btn-gold" data-join="${ev.id}" style="width:auto; padding:.5rem 1.2rem; font-size:.85rem">Iscriviti</button>
        <div class="join-form" id="join-${ev.id}" style="display:none; margin-top:1rem">
          <div class="field-row">
            <div><label>Nome</label><input type="text" id="jn-${ev.id}"></div>
            <div><label>Persone</label><input type="number" min="1" value="1" id="jp-${ev.id}"></div>
          </div>
          <div class="field-row">
            <div><label>Email</label><input type="email" id="je-${ev.id}"></div>
            <div><label>Telefono</label><input type="text" id="jt-${ev.id}"></div>
          </div>
          <button class="btn btn-gold" data-confirm-join="${ev.id}">Conferma iscrizione</button>
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
      ev.registrations = ev.registrations || [];
      ev.registrations.push({
        id: uid(),
        name,
        email: document.getElementById('je-' + id).value.trim(),
        phone: document.getElementById('jt-' + id).value.trim(),
        people: parseInt(document.getElementById('jp-' + id).value, 10) || 1,
        created_at: new Date().toISOString(),
      });
      saveData(data);
      showToast('Iscrizione registrata, a presto!', 'success');
      renderEvents();
    }));
  }
  renderEvents();

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

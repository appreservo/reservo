/* Reservo demo - data layer (localStorage, single utente) */
const DB_KEY = 'reservo_demo_data';
const DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const ALLERGENS = ['Glutine','Lattosio','Uova','Frutta a guscio','Pesce','Crostacei','Soia','Sedano','Senape','Solfiti'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function slugify(text) {
  return text
    .toString()
    .normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function todayStr() { return fmtDate(new Date()); }

function fmtDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}
function euro(n) { return '€ ' + Number(n).toFixed(2).replace('.', ','); }

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function statusLabel(s) {
  return { pending: 'In attesa', confirmed: 'Confermata', rejected: 'Rifiutata', cancelled: 'Annullata' }[s] || s;
}
function typeLabel(t) {
  return { restaurant: 'Ristorante / Bar', artisan: 'Artigiano / Estetista', professional: 'Professionista / Studio' }[t] || t;
}

/* funzionalità opzionali nascoste di default in base al tipo di attività, per i nuovi account */
function defaultHiddenFeatures(type) {
  if (type === 'restaurant') return ['customers_registry'];
  return [];
}
/* campi di dettaglio nascosti di default (es. anagrafica cliente) in base al tipo di attività */
function defaultHiddenFields(type) {
  if (type === 'artisan') return ['fiscal_code'];
  return [];
}

/* dati vuoti per un nuovo account: solo il profilo, personalizzato con i dati di registrazione */
function emptyData(profile) {
  profile = profile || {};
  const type = profile.businessType || 'restaurant';
  return {
    profile: {
      business_name: profile.businessName || '',
      type,
      slug: profile.businessName ? slugify(profile.businessName) : '',
      email: profile.email || '',
      phone: '',
      address: '',
      description: '',
      booking_mode: 'manual',
      notification_emails: profile.email || '',
      hidden_features: defaultHiddenFeatures(type),
      hidden_fields: defaultHiddenFields(type),
    },
    coupons: [],
    hours: [
      { day: 0, open: '09:00', close: '18:00', closed: false },
      { day: 1, open: '09:00', close: '18:00', closed: false },
      { day: 2, open: '09:00', close: '18:00', closed: false },
      { day: 3, open: '09:00', close: '18:00', closed: false },
      { day: 4, open: '09:00', close: '18:00', closed: false },
      { day: 5, open: '09:00', close: '18:00', closed: false },
      { day: 6, open: '00:00', close: '00:00', closed: true },
    ],
    closures: [],
    menu: [],
    services: [],
    tables: [],
    staff: [],
    customers: [],
    events: [],
    bookings: [],
  };
}

/* dati di esempio (demo "Ristorante Da Mario"), usati solo dal pulsante "Ripristina dati di esempio" */
function demoData() {
  const today = new Date();

  return {
    profile: {
      business_name: 'Ristorante Da Mario',
      type: 'restaurant',
      slug: 'damario',
      email: 'info@damario.it',
      phone: '+39 02 1234567',
      address: 'Via Roma 12, Milano',
      description: 'Cucina tradizionale italiana nel cuore di Milano. Ingredienti freschi, ricette di famiglia, atmosfera accogliente.',
      booking_mode: 'manual',
      notification_emails: 'info@damario.it',
    },
    coupons: [
      { id: uid(), code: 'BENVENUTO10', type: 'percent', value: 10, valid_from: '', valid_to: '', max_uses: 0, used_count: 0, active: true },
    ],
    hours: [
      { day: 0, open: '12:00', close: '22:30', closed: false },
      { day: 1, open: '12:00', close: '22:30', closed: false },
      { day: 2, open: '12:00', close: '22:30', closed: false },
      { day: 3, open: '12:00', close: '22:30', closed: false },
      { day: 4, open: '12:00', close: '23:00', closed: false },
      { day: 5, open: '12:00', close: '23:00', closed: false },
      { day: 6, open: '00:00', close: '00:00', closed: true },
    ],
    closures: [
      { id: uid(), date: fmtDate(addDays(today, 18)), reason: 'Chiuso per ferie' },
    ],
    menu: [
      { id: uid(), category: 'Antipasti', name: 'Bruschetta al pomodoro', description: 'Pane tostato, pomodorini, basilico, olio EVO', price: 6.5, allergens: ['Glutine'], available: true },
      { id: uid(), category: 'Antipasti', name: 'Tagliere di salumi e formaggi', description: 'Selezione di salumi e formaggi locali', price: 12, allergens: ['Lattosio'], available: true },
      { id: uid(), category: 'Primi', name: 'Tagliatelle al ragù', description: 'Pasta fresca all\'uovo con ragù di manzo', price: 11, allergens: ['Glutine','Uova'], available: true },
      { id: uid(), category: 'Primi', name: 'Risotto ai funghi porcini', description: 'Riso Carnaroli, funghi porcini, parmigiano', price: 13, allergens: ['Lattosio'], available: true },
      { id: uid(), category: 'Secondi', name: 'Tagliata di manzo', description: 'Con rucola, grana e pomodorini', price: 19, allergens: [], available: true },
      { id: uid(), category: 'Secondi', name: 'Branzino al forno', description: 'Con patate e olive taggiasche', price: 18, allergens: ['Pesce'], available: true },
      { id: uid(), category: 'Dolci', name: 'Tiramisù della casa', description: 'Ricetta tradizionale fatta in casa', price: 6, allergens: ['Glutine','Lattosio','Uova'], available: true },
      { id: uid(), category: 'Bevande', name: 'Calice di vino della casa', description: 'Rosso o bianco', price: 4.5, allergens: ['Solfiti'], available: true },
    ],
    services: [
      { id: uid(), name: 'Pranzo', duration: 90, price: null },
      { id: uid(), name: 'Cena', duration: 120, price: null },
    ],
    tables: [
      { id: uid(), name: 'Tavolo 1', capacity: 2 },
      { id: uid(), name: 'Tavolo 2', capacity: 2 },
      { id: uid(), name: 'Tavolo 3', capacity: 4 },
      { id: uid(), name: 'Tavolo 4', capacity: 4 },
      { id: uid(), name: 'Tavolo 5', capacity: 6 },
      { id: uid(), name: 'Tavolo 6 (esterno)', capacity: 8 },
    ],
    staff: [
      { id: uid(), name: 'Mario Rossi', role: 'Titolare / Chef' },
      { id: uid(), name: 'Giulia Bianchi', role: 'Sala' },
      { id: uid(), name: 'Luca Verdi', role: 'Cameriere' },
    ],
    customers: [],
    events: [
      {
        id: uid(), title: 'Serata di degustazione vini',
        description: 'Una serata speciale alla scoperta dei migliori vini del territorio, abbinati a piccoli assaggi dello chef.',
        date: fmtDate(addDays(today, 12)), time: '20:00', location: 'Sala principale',
        max_participants: 20,
        registrations: [
          { id: uid(), name: 'Anna Ferrari', email: 'anna.ferrari@example.com', phone: '333 1112222', people: 2, created_at: new Date().toISOString() },
        ],
        waitlist: [],
      },
    ],
    bookings: (() => {
      const list = [];
      const statuses = ['confirmed','confirmed','pending','confirmed','rejected','confirmed','pending'];
      const names = [
        ['Marco Esposito','marco.esposito@example.com','339 1234567'],
        ['Sara Conti','sara.conti@example.com','347 2345678'],
        ['Davide Ferri','davide.ferri@example.com','333 3456789'],
        ['Elena Greco','elena.greco@example.com','328 4567890'],
        ['Paolo Russo','paolo.russo@example.com','345 5678901'],
        ['Chiara Romano','chiara.romano@example.com','335 6789012'],
        ['Federico Galli','federico.galli@example.com','340 7890123'],
      ];
      const offsets = [-3, -2, -1, 0, 0, 1, 3];
      const times = ['20:00','13:00','19:30','12:30','21:00','20:30','13:30'];
      const sizes = [2, 4, 2, 6, 3, 2, 4];
      for (let i = 0; i < names.length; i++) {
        list.push({
          id: uid(),
          customer_name: names[i][0], email: names[i][1], phone: names[i][2],
          date: fmtDate(addDays(today, offsets[i])), time: times[i],
          party_size: sizes[i], status: statuses[i],
          notes: i === 3 ? 'Tavolo vicino alla finestra se possibile' : '',
          created_at: new Date(addDays(today, offsets[i]-1)).toISOString(),
        });
      }
      // a few more spread across the month for stats
      for (let i = 0; i < 14; i++) {
        const off = -25 + i * 2;
        list.push({
          id: uid(),
          customer_name: 'Cliente ' + (i+1), email: `cliente${i+1}@example.com`, phone: '320 000' + (1000+i),
          date: fmtDate(addDays(today, off)), time: ['12:30','13:00','19:30','20:00','20:30','21:00'][i % 6],
          party_size: [2,2,4,3,2,5][i % 6], status: 'confirmed',
          notes: '', created_at: new Date(addDays(today, off-1)).toISOString(),
        });
      }
      return list;
    })(),
  };
}

/* sottoinsieme pubblico dei dati, usato dal sito pubblico (sito.html?b=slug) */
function buildPublicData(data) {
  return {
    profile: data.profile,
    hours: data.hours,
    closures: data.closures,
    menu: data.menu,
    services: data.services,
    tables: data.tables,
    // Solo il numero, non i nomi: serve a calcolare quante prenotazioni
    // sovrapposte sono gestibili quando un servizio non è assegnato a una
    // persona specifica (vedi Impostazioni -> Servizi -> "Assegnato a").
    staffCount: Math.max(1, (data.staff || []).length),
    events: (data.events || []).map(ev => ({
      id: ev.id, title: ev.title, description: ev.description,
      date: ev.date, time: ev.time, location: ev.location,
      max_participants: ev.max_participants,
      taken: (ev.registrations || []).reduce((s, r) => s + (r.people || 1), 0),
    })),
    bookings: (data.bookings || [])
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .map(b => ({ date: b.date, time: b.time, status: b.status, service_id: b.service_id || null })),
    coupons: (data.coupons || [])
      .filter(c => c.active && (!c.valid_to || c.valid_to >= todayStr()))
      .map(c => ({ code: c.code, type: c.type, value: c.value, valid_from: c.valid_from, valid_to: c.valid_to, max_uses: c.max_uses, used_count: c.used_count })),
  };
}

let _dataCache = null;

function waitForAuthReady() {
  if (window.reservoAuth && window.reservoAuth.currentUser) return Promise.resolve();
  return new Promise(resolve => {
    window.addEventListener('reservo-auth-ready', () => resolve(), { once: true });
  });
}

async function loadData() {
  if (_dataCache) return _dataCache;
  await waitForAuthReady();
  const uid = window.reservoAuth.getBusinessUid();
  const remote = await window.reservoAuth.getBusinessData(uid);
  if (remote) {
    _dataCache = remote;
  } else {
    _dataCache = emptyData(window.reservoAuth.currentProfile);
    await window.reservoAuth.saveBusinessData(uid, _dataCache);
  }
  return _dataCache;
}

function saveData(data) {
  _dataCache = data;
  const uid = window.reservoAuth && window.reservoAuth.getBusinessUid();
  if (uid) {
    window.reservoAuth.saveBusinessData(uid, data).catch(() => {});
    window.reservoAuth.savePublicBusinessData(uid, buildPublicData(data)).catch(() => {});
  }
}

async function resetDemoData() {
  const uid = window.reservoAuth.getBusinessUid();
  _dataCache = demoData();
  await window.reservoAuth.saveBusinessData(uid, _dataCache);
  await window.reservoAuth.savePublicBusinessData(uid, buildPublicData(_dataCache));
  return _dataCache;
}

async function clearAllData() {
  const uid = window.reservoAuth.getBusinessUid();
  const data = _dataCache || emptyData(window.reservoAuth.currentProfile);
  data.menu = [];
  data.bookings = [];
  data.events = [];
  data.closures = [];
  data.coupons = [];
  data.services = [];
  data.tables = [];
  data.staff = [];
  data.customers = [];
  _dataCache = data;
  await window.reservoAuth.saveBusinessData(uid, data);
  await window.reservoAuth.savePublicBusinessData(uid, buildPublicData(data));
  await window.reservoAuth.deleteAllBusinessBookings(uid).catch(() => {});
  _liveBookingsCache = [];
  return data;
}

let _liveBookingsCache = null;

/* tutte le prenotazioni: quelle del gestionale + quelle scritte dal sito pubblico (collezione 'bookings') */
async function loadAllBookings() {
  const data = await loadData();
  if (_liveBookingsCache === null) {
    const uid = window.reservoAuth.getBusinessUid();
    _liveBookingsCache = await window.reservoAuth.getBusinessBookings(uid).catch(() => []);
  }
  return data.bookings.concat(_liveBookingsCache);
}

/* customers derived from bookings */
function getCustomers(bookings) {
  const map = new Map();
  bookings.forEach(b => {
    const key = b.email || b.phone || b.customer_name;
    if (!map.has(key)) {
      map.set(key, { name: b.customer_name, email: b.email, phone: b.phone, bookings: [] });
    }
    map.get(key).bookings.push(b);
  });
  return Array.from(map.values()).sort((a, b) => b.bookings.length - a.bookings.length);
}

/* esporta un array di oggetti come file CSV scaricabile */
function exportCSV(filename, rows, columns) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = columns.map(c => escape(c.label)).join(';');
  const lines = rows.map(row => columns.map(c => escape(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(';'));
  const csv = '﻿' + [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* render di stelle (rating 1-5), readOnly=true per visualizzazione */
function starsHtml(rating, readOnly = true, name = 'rating') {
  const r = Math.round(rating || 0);
  if (readOnly) {
    return `<span class="stars">${[1,2,3,4,5].map(i => `<span class="star ${i <= r ? 'filled' : ''}">★</span>`).join('')}</span>`;
  }
  return `<span class="stars stars-input" data-name="${name}">${[1,2,3,4,5].map(i =>
    `<span class="star ${i <= r ? 'filled' : ''}" data-value="${i}">★</span>`).join('')}</span>`;
}

/* toast helper */
function showToast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'toast' + (type ? ' ' + type : ''); }, 2600);
}

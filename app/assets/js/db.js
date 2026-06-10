/* Reservo demo - data layer (localStorage, single utente) */
const DB_KEY = 'reservo_demo_data';
const DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const ALLERGENS = ['Glutine','Lattosio','Uova','Frutta a guscio','Pesce','Crostacei','Soia','Sedano','Senape','Solfiti'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

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

function statusLabel(s) {
  return { pending: 'In attesa', confirmed: 'Confermata', rejected: 'Rifiutata', cancelled: 'Annullata' }[s] || s;
}
function typeLabel(t) {
  return { restaurant: 'Ristorante / Bar', artisan: 'Artigiano / Estetista', professional: 'Professionista / Studio' }[t] || t;
}

function defaultData() {
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
    events: [
      {
        id: uid(), title: 'Serata di degustazione vini',
        description: 'Una serata speciale alla scoperta dei migliori vini del territorio, abbinati a piccoli assaggi dello chef.',
        date: fmtDate(addDays(today, 12)), time: '20:00', location: 'Sala principale',
        max_participants: 20,
        registrations: [
          { id: uid(), name: 'Anna Ferrari', email: 'anna.ferrari@example.com', phone: '333 1112222', people: 2, created_at: new Date().toISOString() },
        ],
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
          customer_name: 'Cliente Demo ' + (i+1), email: `cliente${i+1}@example.com`, phone: '320 000' + (1000+i),
          date: fmtDate(addDays(today, off)), time: ['12:30','13:00','19:30','20:00','20:30','21:00'][i % 6],
          party_size: [2,2,4,3,2,5][i % 6], status: 'confirmed',
          notes: '', created_at: new Date(addDays(today, off-1)).toISOString(),
        });
      }
      return list;
    })(),
  };
}

function loadData() {
  let raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const data = defaultData();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return data;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const data = defaultData();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return data;
  }
}

function saveData(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function resetDemoData() {
  localStorage.removeItem(DB_KEY);
  return loadData();
}

function clearAllData() {
  const data = defaultData();
  data.menu = [];
  data.bookings = [];
  data.events = [];
  data.closures = [];
  localStorage.setItem(DB_KEY, JSON.stringify(data));
  return data;
}

/* customers derived from bookings */
function getCustomers(data) {
  const map = new Map();
  data.bookings.forEach(b => {
    const key = b.email || b.phone || b.customer_name;
    if (!map.has(key)) {
      map.set(key, { name: b.customer_name, email: b.email, phone: b.phone, bookings: [] });
    }
    map.get(key).bookings.push(b);
  });
  return Array.from(map.values()).sort((a, b) => b.bookings.length - a.bookings.length);
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

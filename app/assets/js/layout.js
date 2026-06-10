/* Reservo demo - layout (sidebar + topbar) */

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  bookings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v20l9-5 9 5V2z"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v.01M17.5 17.5h.01M14 21h3v-3M21 21v-3h-3"/></svg>',
  events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 21 22l-3-1-1.5 3-3.5-7M8.5 13.5 3 22l3-1 1.5 3 3.5-7"/></svg>',
  services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  tables: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="2"/><path d="M5 13v4M19 13v4M3 11l2-4h14l2 4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>',
  menuburger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
};

const NAV = [
  { group: null, items: [
    { href: 'index.html', label: 'Dashboard', icon: 'dashboard' },
  ]},
  { group: 'Prenotazioni', items: [
    { href: 'prenotazioni.html', label: 'Prenotazioni', icon: 'bookings' },
    { href: 'clienti.html', label: 'Clienti', icon: 'customers' },
    { href: 'statistiche.html', label: 'Statistiche', icon: 'stats' },
  ]},
  { group: 'Catalogo', items: [
    { href: 'menu.html', label: 'Menu', icon: 'menu' },
    { href: 'sito.html', label: 'QR Code', icon: 'qr', external: true },
  ]},
  { group: 'Attività', items: [
    { href: 'eventi.html', label: 'Eventi', icon: 'events' },
  ]},
  { group: 'Configurazione', items: [
    { href: 'impostazioni.html#servizi', label: 'Servizi', icon: 'services', match: 'impostazioni.html' },
    { href: 'impostazioni.html#staff', label: 'Staff', icon: 'staff', match: 'impostazioni.html' },
    { href: 'impostazioni.html#postazioni', label: 'Postazioni', icon: 'tables', match: 'impostazioni.html' },
  ]},
  { group: 'Impostazioni', items: [
    { href: 'impostazioni.html', label: 'Impostazioni', icon: 'settings' },
  ]},
];

function renderLayout(pageTitle, data) {
  const current = location.pathname.split('/').pop() || 'index.html';

  let sidebarHtml = `
    <a href="index.html" class="sidebar-brand">
      <img src="assets/img/logo.png" alt="Reservo">
      <span>Reservo</span>
    </a>`;

  NAV.forEach(group => {
    if (group.group) {
      sidebarHtml += `<div class="sidebar-group"><div class="sidebar-group-label">${group.group}</div>`;
    } else {
      sidebarHtml += `<div class="sidebar-group">`;
    }
    group.items.forEach(item => {
      const matchPage = item.match || item.href.split('#')[0];
      const itemHash = item.href.split('#')[1];
      const activeClass = (matchPage === current && (itemHash ? location.hash === '#' + itemHash : true)) ? 'active' : '';
      const target = item.external ? ' target="_blank"' : '';
      sidebarHtml += `<a href="${item.href}"${target} class="sidebar-link ${activeClass}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
    });
    sidebarHtml += `</div>`;
  });

  const topbarHtml = `
    <div class="flex items-center gap-3">
      <button class="menu-btn" id="menuToggle">${ICONS.menuburger}</button>
      <h1>${pageTitle}</h1>
    </div>
    <div class="topbar-actions">
      <a href="sito.html" target="_blank" class="btn btn-outline btn-sm">${ICONS.external} Anteprima sito</a>
      <div class="badge badge-navy">${data && data.profile ? data.profile.business_name : ''}</div>
    </div>`;

  document.getElementById('sidebar').innerHTML = sidebarHtml;
  document.getElementById('topbar').innerHTML = topbarHtml;

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  fillIcons();
}

function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}

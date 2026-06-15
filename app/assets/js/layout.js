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
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  broadcast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9-9M4 11a5 5 0 0 1 5-5M4 11a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1zM9 12l1 9 2-1 2 1 1-9"/></svg>',
  coupon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M9 9v6"/></svg>',
};

const NAV = [
  { group: null, items: [
    { href: 'index.html', label: 'Dashboard', icon: 'dashboard' },
  ]},
  { group: 'Prenotazioni', items: [
    { href: 'prenotazioni.html', label: 'Prenotazioni', icon: 'bookings' },
    { href: 'tavoli.html', label: 'Tavoli', icon: 'tables', types: ['restaurant'] },
    { href: 'clienti.html', label: 'Clienti', icon: 'customers' },
    { href: 'statistiche.html', label: 'Statistiche', icon: 'stats' },
  ]},
  { group: 'Catalogo', items: [
    { href: 'menu.html', label: t => t === 'restaurant' ? 'Menu' : 'Listino prezzi', icon: 'menu' },
    { href: 'sito.html', label: 'QR Code', icon: 'qr', external: true },
  ]},
  { group: 'Attività', items: [
    { href: 'eventi.html', label: 'Eventi', icon: 'events', types: ['restaurant'] },
    { href: 'recensioni.html', label: 'Recensioni', icon: 'star' },
    { href: 'comunicazioni.html', label: 'Comunicazioni', icon: 'broadcast' },
  ]},
  { group: 'Configurazione', items: [
    { href: 'impostazioni.html#servizi', label: 'Servizi', icon: 'services', match: 'impostazioni.html' },
    { href: 'impostazioni.html#staff', label: 'Staff', icon: 'staff', match: 'impostazioni.html' },
    { href: 'impostazioni.html#postazioni', label: 'Postazioni', icon: 'tables', match: 'impostazioni.html', types: ['restaurant'] },
    { href: 'impostazioni.html#coupon', label: 'Coupon', icon: 'coupon', match: 'impostazioni.html' },
  ]},
  { group: 'Impostazioni', items: [
    { href: 'impostazioni.html', label: 'Impostazioni', icon: 'settings' },
  ]},
];

function renderLayout(pageTitle, data) {
  const current = location.pathname.split('/').pop() || 'index.html';
  const businessType = (data && data.profile && data.profile.type) || 'restaurant';

  let sidebarHtml = `
    <a href="index.html" class="sidebar-brand">
      <img src="assets/img/logo.png" alt="Reservo">
      <span class="sidebar-brand-text">
        <span class="sidebar-brand-name">Reservo</span>
        <span class="js-user-name"></span>
      </span>
    </a>`;

  NAV.forEach(group => {
    const items = group.items.filter(item => !item.types || item.types.includes(businessType));
    if (items.length === 0) return;
    if (group.group) {
      sidebarHtml += `<div class="sidebar-group"><div class="sidebar-group-label">${group.group}</div>`;
    } else {
      sidebarHtml += `<div class="sidebar-group">`;
    }
    items.forEach(item => {
      const matchPage = item.match || item.href.split('#')[0];
      const itemHash = item.href.split('#')[1];
      const activeClass = (matchPage === current && (itemHash ? location.hash === '#' + itemHash : true)) ? 'active' : '';
      const target = item.external ? ' target="_blank"' : '';
      const label = (typeof item.label === 'function') ? item.label(businessType) : item.label;
      sidebarHtml += `<a href="${item.href}"${target} class="sidebar-link ${activeClass}">${ICONS[item.icon]}<span>${label}</span></a>`;
    });
    sidebarHtml += `</div>`;
  });

  const siteSlug = data && data.profile && data.profile.slug;
  const siteHref = 'sito.html' + (siteSlug ? '?b=' + encodeURIComponent(siteSlug) : '');

  const topbarHtml = `
    <div class="flex items-center gap-3">
      <button class="menu-btn" id="menuToggle">${ICONS.menuburger}</button>
      <div class="topbar-brand">
        <img src="assets/img/logo.png" alt="Reservo">
        <span class="topbar-brand-text topbar-brand-text--app">
          <span class="topbar-brand-name">Reservo</span>
          <span class="js-user-name"></span>
        </span>
      </div>
      <h1>${pageTitle}</h1>
    </div>
    <div class="topbar-actions">
      <a href="${siteHref}" target="_blank" class="btn btn-outline btn-sm">${ICONS.external} <span class="btn-label">Anteprima sito</span></a>
      <div class="badge badge-navy">${data && data.profile ? data.profile.business_name : ''}</div>
      <button class="btn btn-outline btn-sm" id="logoutBtn">Esci</button>
    </div>`;

  document.getElementById('sidebar').innerHTML = sidebarHtml;
  document.getElementById('topbar').innerHTML = topbarHtml;

  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  function setSidebarOpen(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    overlay.classList.toggle('open', open);
  }

  document.getElementById('menuToggle').addEventListener('click', () => {
    setSidebarOpen(!document.getElementById('sidebar').classList.contains('open'));
  });

  overlay.addEventListener('click', () => setSidebarOpen(false));

  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || e.target.closest('#menuToggle')) return;
    setSidebarOpen(false);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => window.reservoAuth.logout());

  const currentUser = window.reservoAuth.currentUser;
  if (currentUser && !currentUser.emailVerified &&
      currentUser.providerData[0] && currentUser.providerData[0].providerId === 'password') {
    let verifyBanner = document.getElementById('verifyEmailBanner');
    if (!verifyBanner) {
      verifyBanner = document.createElement('div');
      verifyBanner.id = 'verifyEmailBanner';
      verifyBanner.className = 'verify-email-banner';
      verifyBanner.innerHTML = `
        <span>Verifica il tuo indirizzo email per proteggere il tuo account.<span class="hide-mobile"> Controlla la posta in arrivo.</span></span>
        <button class="btn btn-sm" id="resendVerificationBtn">Invia di nuovo</button>`;
      document.body.prepend(verifyBanner);
      document.getElementById('resendVerificationBtn').addEventListener('click', async (e) => {
        e.target.disabled = true;
        try {
          await window.reservoAuth.resendVerificationEmail();
          showToast('Email di verifica inviata', 'success');
        } catch (err) {
          showToast('Invio non riuscito, riprova più tardi', 'error');
        }
        e.target.disabled = false;
      });
    }
  }

  if (window.reservoAuth.isViewingAs && window.reservoAuth.isViewingAs()) {
    let banner = document.getElementById('impersonationBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'impersonationBanner';
      banner.className = 'impersonation-banner';
      banner.innerHTML = `
        <span>Stai visualizzando in sola lettura il gestionale di <strong>${(data && data.profile && data.profile.business_name) || 'questa attività'}</strong> come admin.</span>
        <button class="btn btn-sm" id="exitImpersonationBtn">Esci dalla visualizzazione</button>`;
      document.body.prepend(banner);
      document.getElementById('exitImpersonationBtn').addEventListener('click', () => {
        sessionStorage.removeItem('reservo_viewAs');
        location.href = 'admin.html';
      });
    }
  }

  fillIcons();
}

function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}

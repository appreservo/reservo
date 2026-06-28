(async function () {
  const data = await loadData();
  renderLayout('Eventi', data);

  function render() {
    const container = document.getElementById('eventsList');
    const events = data.events.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (events.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessun evento creato. Crea il primo evento speciale.</p></div>`;
      return;
    }
    container.innerHTML = `<table><thead><tr>
        <th>Data</th><th>Titolo</th><th>Luogo</th><th>Iscritti</th><th></th>
      </tr></thead><tbody>` +
      events.map(ev => {
        const peopleCount = (ev.registrations || []).reduce((s, r) => s + (r.people || 1), 0);
        const waitlistCount = (ev.waitlist || []).length;
        const past = ev.date < todayStr();
        return `<tr ${past ? 'style="opacity:.55"' : ''}>
          <td data-label="Data">${fmtDateLong(ev.date)}<br><span class="small text-mid">ore ${ev.time}</span></td>
          <td data-label="Titolo"><strong>${escapeHtml(ev.title)}</strong><div class="small text-mid">${escapeHtml((ev.description || '').slice(0, 80))}${(ev.description||'').length>80?'…':''}</div></td>
          <td data-label="Luogo">${escapeHtml(ev.location || '—')}</td>
          <td data-label="Iscritti">${peopleCount} / ${ev.max_participants}${waitlistCount ? `<div class="small text-mid">${waitlistCount} in lista d'attesa</div>` : ''}</td>
          <td data-label="">
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" data-reg="${ev.id}">Iscritti</button>
              <button class="btn btn-outline btn-sm" data-edit="${ev.id}">Modifica</button>
            </div>
          </td>
        </tr>`;
      }).join('') + `</tbody></table>`;

    container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      openEventModal(data.events.find(e => e.id === btn.dataset.edit));
    }));
    container.querySelectorAll('[data-reg]').forEach(btn => btn.addEventListener('click', () => {
      openRegModal(data.events.find(e => e.id === btn.dataset.reg));
    }));
  }

  // ---------- event modal ----------
  const eventModal = document.getElementById('eventModal');

  function openEventModal(ev) {
    document.getElementById('eventModalTitle').textContent = ev ? 'Modifica evento' : 'Nuovo evento';
    document.getElementById('eId').value = ev ? ev.id : '';
    document.getElementById('eTitle').value = ev ? ev.title : '';
    document.getElementById('eDescription').value = ev ? (ev.description || '') : '';
    document.getElementById('eDate').value = ev ? ev.date : todayStr();
    document.getElementById('eTime').value = ev ? ev.time : '20:00';
    document.getElementById('eLocation').value = ev ? (ev.location || '') : '';
    document.getElementById('eMax').value = ev ? ev.max_participants : 20;
    document.getElementById('deleteEventBtn').style.display = ev ? 'inline-flex' : 'none';
    eventModal.classList.add('open');
  }

  document.getElementById('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('eId').value;
    const payload = {
      title: document.getElementById('eTitle').value.trim(),
      description: document.getElementById('eDescription').value.trim(),
      date: document.getElementById('eDate').value,
      time: document.getElementById('eTime').value,
      location: document.getElementById('eLocation').value.trim(),
      max_participants: parseInt(document.getElementById('eMax').value, 10) || 1,
    };
    if (id) {
      Object.assign(data.events.find(ev => ev.id === id), payload);
      showToast('Evento aggiornato', 'success');
    } else {
      payload.id = uid();
      payload.registrations = [];
      data.events.push(payload);
      showToast('Evento creato', 'success');
    }
    saveData(data);
    eventModal.classList.remove('open');
    render();
  });

  document.getElementById('deleteEventBtn').addEventListener('click', () => {
    const id = document.getElementById('eId').value;
    if (!id || !confirm('Eliminare questo evento?')) return;
    data.events = data.events.filter(ev => ev.id !== id);
    saveData(data);
    eventModal.classList.remove('open');
    showToast('Evento eliminato');
    render();
  });

  document.getElementById('newEventBtn').addEventListener('click', () => openEventModal(null));

  // ---------- registrations modal ----------
  const regModal = document.getElementById('regModal');
  let currentEventId = null;

  function openRegModal(ev) {
    currentEventId = ev.id;
    document.getElementById('regModalTitle').textContent = 'Iscritti — ' + ev.title;
    renderRegList(ev);
    regModal.classList.add('open');
    document.getElementById('exportRegBtn').onclick = () => {
      const regs = (ev.registrations || []).map(r => ({ ...r, _lista: 'Confermato' }));
      const waitlist = (ev.waitlist || []).map(r => ({ ...r, _lista: 'Lista d\'attesa' }));
      exportCSV(`iscritti-${ev.title.slice(0, 30).replace(/[^\w\s]/g, '')}.csv`, [...regs, ...waitlist], [
        { label: 'Nome', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Telefono', value: 'phone' },
        { label: 'Persone', value: r => r.people || 1 },
        { label: 'Lista', value: '_lista' },
      ]);
    };
  }

  function renderRegList(ev) {
    const list = document.getElementById('regList');
    const regs = ev.registrations || [];
    const waitlist = ev.waitlist || [];

    let html = '';
    if (regs.length === 0) {
      html += `<p class="text-mid small">Nessun iscritto ancora.</p>`;
    } else {
      html += `<table><thead><tr><th>Nome</th><th>Contatti</th><th>Persone</th><th></th></tr></thead><tbody>` +
        regs.map(r => `<tr>
          <td data-label="Nome">${escapeHtml(r.name)}</td>
          <td data-label="Contatti" class="small text-mid">${[r.email, r.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
          <td data-label="Persone">${r.people || 1}</td>
          <td data-label=""><button class="btn btn-danger btn-sm" data-remove-reg="${r.id}">Rimuovi</button></td>
        </tr>`).join('') + `</tbody></table>`;
    }

    if (waitlist.length > 0) {
      html += `<h4 class="text-navy mt-3" style="margin-bottom:.5rem">Lista d'attesa</h4>`;
      html += `<table><thead><tr><th>Nome</th><th>Contatti</th><th>Persone</th><th></th></tr></thead><tbody>` +
        waitlist.map(r => `<tr>
          <td data-label="Nome">${escapeHtml(r.name)}</td>
          <td data-label="Contatti" class="small text-mid">${[r.email, r.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
          <td data-label="Persone">${r.people || 1}</td>
          <td data-label="">
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" data-promote-reg="${r.id}">Promuovi</button>
              <button class="btn btn-danger btn-sm" data-remove-waitlist="${r.id}">Rimuovi</button>
            </div>
          </td>
        </tr>`).join('') + `</tbody></table>`;
    }

    list.innerHTML = html;

    list.querySelectorAll('[data-remove-reg]').forEach(btn => btn.addEventListener('click', () => {
      ev.registrations = ev.registrations.filter(r => r.id !== btn.dataset.removeReg);
      saveData(data);
      renderRegList(ev);
      render();
    }));
    list.querySelectorAll('[data-remove-waitlist]').forEach(btn => btn.addEventListener('click', () => {
      ev.waitlist = ev.waitlist.filter(r => r.id !== btn.dataset.removeWaitlist);
      saveData(data);
      renderRegList(ev);
      render();
    }));
    list.querySelectorAll('[data-promote-reg]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.promoteReg;
      const entry = ev.waitlist.find(r => r.id === id);
      if (!entry) return;
      ev.waitlist = ev.waitlist.filter(r => r.id !== id);
      ev.registrations = ev.registrations || [];
      ev.registrations.push(entry);
      saveData(data);
      showToast('Iscritto promosso dalla lista d\'attesa', 'success');
      renderRegList(ev);
      render();
    }));
  }

  document.getElementById('regForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ev = data.events.find(x => x.id === currentEventId);
    ev.registrations = ev.registrations || [];
    const peopleCount = ev.registrations.reduce((s, r) => s + (r.people || 1), 0);
    const newPeople = parseInt(document.getElementById('rPeople').value, 10) || 1;
    if (peopleCount + newPeople > ev.max_participants) {
      if (!confirm(`L'evento è al completo (${peopleCount}/${ev.max_participants} posti). Aggiungere comunque?`)) return;
    }
    ev.registrations.push({
      id: uid(),
      name: document.getElementById('rName').value.trim(),
      email: document.getElementById('rEmail').value.trim(),
      phone: document.getElementById('rPhone').value.trim(),
      people: parseInt(document.getElementById('rPeople').value, 10) || 1,
      created_at: new Date().toISOString(),
    });
    saveData(data);
    document.getElementById('regForm').reset();
    document.getElementById('rPeople').value = 1;
    renderRegList(ev);
    render();
    showToast('Iscritto aggiunto', 'success');
  });

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').classList.remove('open');
  }));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => {
    if (e.target === ov) ov.classList.remove('open');
  }));

  render();
})();

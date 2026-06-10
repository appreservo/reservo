(function () {
  const data = loadData();
  renderLayout('Menu / Listino', data);

  let photoData = null; // base64 of currently selected photo in modal

  function categories() {
    return [...new Set(data.menu.map(i => i.category))];
  }

  function populateFilters() {
    const cats = categories();
    const filterSel = document.getElementById('filterCategory');
    const current = filterSel.value;
    filterSel.innerHTML = '<option value="">Tutte le categorie</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    if (cats.includes(current)) filterSel.value = current;
    document.getElementById('categoryList').innerHTML = cats.map(c => `<option value="${c}">`).join('');
  }

  function render() {
    populateFilters();
    const filter = document.getElementById('filterCategory').value;
    let items = data.menu.slice();
    if (filter) items = items.filter(i => i.category === filter);

    const container = document.getElementById('menuList');
    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nessuna voce nel menu. Aggiungi la prima voce.</p></div>`;
      return;
    }

    // group by category preserving order of first appearance
    const groups = new Map();
    items.forEach(i => {
      if (!groups.has(i.category)) groups.set(i.category, []);
      groups.get(i.category).push(i);
    });

    let html = '';
    groups.forEach((groupItems, cat) => {
      html += `<div class="category-block"><h3>${cat}</h3>`;
      groupItems.forEach(item => {
        html += `<div class="menu-item">
          ${item.photo ? `<img src="${item.photo}" alt="">` : `<div class="ph">${item.name.charAt(0)}</div>`}
          <div class="info">
            <h4>${item.name} ${!item.available ? '<span class="badge badge-cancelled">Non disponibile</span>' : ''}</h4>
            <div class="small text-mid">${item.description || ''}</div>
            <div class="allergen-tags">${(item.allergens || []).map(a => `<span class="badge badge-gold">${a}</span>`).join('')}</div>
          </div>
          <div class="price">${euro(item.price)}</div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" data-edit="${item.id}">Modifica</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      openModal(data.menu.find(i => i.id === btn.dataset.edit));
    }));
  }

  // ---------- modal ----------
  const modal = document.getElementById('itemModal');

  function buildAllergenChecks(selected) {
    const container = document.getElementById('allergenChecks');
    container.innerHTML = ALLERGENS.map(a => `
      <label class="checkbox-row" style="display:inline-flex; margin-right:.6rem">
        <input type="checkbox" value="${a}" ${selected.includes(a) ? 'checked' : ''}> <span style="font-weight:400; font-size:.85rem">${a}</span>
      </label>`).join('');
  }

  function openModal(item) {
    document.getElementById('itemModalTitle').textContent = item ? 'Modifica voce' : 'Nuova voce';
    document.getElementById('iId').value = item ? item.id : '';
    document.getElementById('iCategory').value = item ? item.category : '';
    document.getElementById('iName').value = item ? item.name : '';
    document.getElementById('iDescription').value = item ? (item.description || '') : '';
    document.getElementById('iPrice').value = item ? item.price : '';
    document.getElementById('iPhoto').value = '';
    photoData = item ? (item.photo || null) : null;
    document.getElementById('iAvailable').checked = item ? item.available !== false : true;
    document.getElementById('deleteItemBtn').style.display = item ? 'inline-flex' : 'none';
    buildAllergenChecks(item ? (item.allergens || []) : []);
    modal.classList.add('open');
  }

  document.getElementById('iPhoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { photoData = reader.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('itemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('iId').value;
    const allergens = Array.from(document.querySelectorAll('#allergenChecks input:checked')).map(c => c.value);
    const payload = {
      category: document.getElementById('iCategory').value.trim(),
      name: document.getElementById('iName').value.trim(),
      description: document.getElementById('iDescription').value.trim(),
      price: parseFloat(document.getElementById('iPrice').value) || 0,
      allergens,
      available: document.getElementById('iAvailable').checked,
      photo: photoData,
    };
    if (id) {
      Object.assign(data.menu.find(i => i.id === id), payload);
      showToast('Voce aggiornata', 'success');
    } else {
      payload.id = uid();
      data.menu.push(payload);
      showToast('Voce creata', 'success');
    }
    saveData(data);
    modal.classList.remove('open');
    render();
  });

  document.getElementById('deleteItemBtn').addEventListener('click', () => {
    const id = document.getElementById('iId').value;
    if (!id || !confirm('Eliminare questa voce dal menu?')) return;
    data.menu = data.menu.filter(i => i.id !== id);
    saveData(data);
    modal.classList.remove('open');
    showToast('Voce eliminata');
    render();
  });

  document.getElementById('newItemBtn').addEventListener('click', () => openModal(null));
  document.getElementById('filterCategory').addEventListener('change', render);

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').classList.remove('open');
  }));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => {
    if (e.target === ov) ov.classList.remove('open');
  }));

  render();
})();

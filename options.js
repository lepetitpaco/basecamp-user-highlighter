(() => {
  const $ = (id) => document.getElementById(id);

  const opacityInput = $('opacityInput');
  const opacityValue = $('opacityValue');
  const personsListEl = $('personsList');
  const statusEl = $('status');

  const newPersonIdInput = $('newPersonIdInput');
  const newDescriptionInput = $('newDescriptionInput');
  const newColorPreviewEl = $('newColorPreview');
  const newColorInput = $('newColorInput');
  const newEnabledInput = $('newEnabledInput');
  const openPaletteNewButton = $('openPaletteNewButton');
  const addPersonButton = $('addPersonButton');
  const clearAllButton = $('clearAllButton');

  const palettePopoverEl = $('palettePopover');
  const palettePreviewEl = $('palettePreview');
  const closePaletteButton = $('closePaletteButton');
  const paletteGridEl = $('paletteGrid');

  const COLOR_SWATCHES = [
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff7043',
    '#ef5350',
    '#f06292',
    '#ba68c8',
    '#9575cd',
    '#7986cb',
    '#64b5f6',
    '#4fc3f7',
    '#4dd0e1',
    '#4db6ac',
    '#81c784',
    '#66bb6a',
    '#aed581',
    '#dce775',
    '#fff176',
    '#a1887f',
    '#90a4ae',
    '#b0bec5',
    '#e0e0e0',
  ];

  function setStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text;
  }

  function getStorageApi() {
    if (typeof browser !== 'undefined' && browser?.storage?.local) return browser.storage.local;
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) return chrome.storage.local;
    return null;
  }

  function storageSet(storageApi, items) {
    try {
      const maybe = storageApi.set(items);
      if (maybe && typeof maybe.then === 'function') return maybe;
    } catch {
      // ignore
    }

    return new Promise((resolve, reject) => {
      try {
        storageApi.set(items, () => resolve());
      } catch (e) {
        reject(e);
      }
    });
  }

  function storageGet(storageApi, keys) {
    try {
      const maybe = storageApi.get(keys);
      if (maybe && typeof maybe.then === 'function') return maybe;
    } catch {
      // ignore
    }

    return new Promise((resolve, reject) => {
      try {
        storageApi.get(keys, resolve);
      } catch (e) {
        reject(e);
      }
    });
  }

  function normalizeHexColor(input) {
    let v = String(input || '').trim();
    if (!v) return null;
    if (!v.startsWith('#')) v = `#${v}`;
    v = v.toLowerCase();

    if (v.length === 4) {
      // #rgb -> #rrggbb
      const r = v[1];
      const g = v[2];
      const b = v[3];
      v = `#${r}${r}${g}${g}${b}${b}`;
    }

    if (!/^#[0-9a-f]{6}$/.test(v)) return null;
    return v;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setPreview(el, hex) {
    if (!(el instanceof HTMLElement)) return;
    const normalized = normalizeHexColor(hex);
    if (!normalized) return;
    el.style.background = normalized;
  }

  // personnes: { [personId]: { enabled, description, color } }
  let personsState = {};
  let highlightOpacity = 0.28;

  let persistTimer = null;
  async function persistNow() {
    const storageApi = getStorageApi();
    if (!storageApi) return;
    // Important: write immediately so that closing/reopening the popup doesn't revert changes.
    await storageSet(storageApi, { persons: personsState, highlightOpacity });
  }

  function persistAllDebounced() {
    const storageApi = getStorageApi();
    if (!storageApi) return;

    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      storageSet(storageApi, { persons: personsState, highlightOpacity }).catch(() => {});
    }, 250);
  }

  window.addEventListener('beforeunload', () => {
    persistNow().catch(() => {});
  });

  function updateOpacityValueText(v) {
    if (!opacityValue) return;
    opacityValue.textContent = String(Number.isFinite(v) ? v.toFixed(2) : '0.28');
  }

  function renderPersons() {
    if (!(personsListEl instanceof HTMLElement)) return;
    personsListEl.innerHTML = '';

    const ids = Object.keys(personsState || {});
    if (!ids.length) {
      personsListEl.textContent = 'Aucune personne configurée.';
      return;
    }

    ids.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    for (const pid of ids) {
      const cfg = personsState[pid] || {};
      const enabled = cfg?.enabled !== false;
      const description = cfg?.description || '';
      const color = normalizeHexColor(cfg?.color) || '#ffeb3b';

      const row = document.createElement('div');
      row.className = 'person-row';
      row.dataset.personId = pid;

      row.innerHTML = `
        <input type="checkbox" class="person-enabled" ${enabled ? 'checked' : ''} />
        <div class="person-id">${escapeHtml(pid)}</div>
        <input type="text" class="person-description" value="${escapeHtml(description)}" autocomplete="off" spellcheck="false" />
        <div class="person-color">
          <div class="color-preview person-color-preview" aria-hidden="true" style="background:${escapeHtml(color)}"></div>
          <input type="text" class="hex-input person-color-input" value="${escapeHtml(color)}" autocomplete="off" spellcheck="false" />
          <button type="button" class="secondary person-palette-button">Palette</button>
        </div>
        <button type="button" class="secondary person-delete-button" title="Supprimer la personne">Supprimer</button>
      `;

      personsListEl.appendChild(row);
    }
  }

  // Palette: one shared popover.
  let activeColorInput = null;

  function openPaletteFor(inputEl) {
    if (!(palettePopoverEl instanceof HTMLElement)) return;
    if (!(inputEl instanceof HTMLElement)) return;

    activeColorInput = inputEl;
    const normalized = normalizeHexColor(inputEl.value) || '#ffeb3b';
    setPreview(palettePreviewEl, normalized);
    palettePopoverEl.hidden = false;
  }

  function closePalette() {
    activeColorInput = null;
    if (palettePopoverEl instanceof HTMLElement) palettePopoverEl.hidden = true;
  }

  function setActiveColorValue(hex) {
    if (!(activeColorInput instanceof HTMLElement)) return;
    const normalized = normalizeHexColor(hex);
    if (!normalized) return;

    activeColorInput.value = normalized;

    // Update preview + state for that row.
    const row = activeColorInput.closest?.('.person-row') || null;
    if (!(row instanceof HTMLElement)) return;
    const pid = row.dataset.personId;

    const preview = row.querySelector('.person-color-preview');
    if (preview instanceof HTMLElement) preview.style.background = normalized;

    if (pid) {
      personsState[pid] = personsState[pid] || {};
      personsState[pid].color = normalized;
    }

    persistAllDebounced();
  }

  function buildPalette() {
    if (!(paletteGridEl instanceof HTMLElement)) return;
    paletteGridEl.innerHTML = '';
    for (const hex of COLOR_SWATCHES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch';
      btn.dataset.hex = hex;
      btn.style.background = hex;
      btn.setAttribute('aria-label', `Couleur ${hex}`);
      paletteGridEl.appendChild(btn);
    }

    paletteGridEl.addEventListener('click', (e) => {
      const swatch = e.target instanceof HTMLElement ? e.target.closest('.color-swatch') : null;
      if (!swatch) return;
      const hex = swatch.dataset.hex;
      if (!hex) return;
      setActiveColorValue(hex);
    });
  }

  personsListEl?.addEventListener('change', (e) => {
    const row = e.target instanceof HTMLElement ? e.target.closest('.person-row') : null;
    if (!(row instanceof HTMLElement)) return;
    const pid = row.dataset.personId;
    if (!pid) return;

    if (e.target instanceof HTMLInputElement && e.target.classList.contains('person-enabled')) {
      personsState[pid] = personsState[pid] || {};
      personsState[pid].enabled = e.target.checked;
      persistAllDebounced();
    }
  });

  personsListEl?.addEventListener('input', (e) => {
    const row = e.target instanceof HTMLElement ? e.target.closest('.person-row') : null;
    if (!(row instanceof HTMLElement)) return;
    const pid = row.dataset.personId;
    if (!pid) return;

    if (!(e.target instanceof HTMLElement)) return;

    if (e.target.classList.contains('person-description')) {
      personsState[pid] = personsState[pid] || {};
      personsState[pid].description = e.target.value;
      persistAllDebounced();
      return;
    }

    if (e.target.classList.contains('person-color-input')) {
      const normalized = normalizeHexColor(e.target.value);
      if (!normalized) return;
      personsState[pid] = personsState[pid] || {};
      personsState[pid].color = normalized;
      const preview = row.querySelector('.person-color-preview');
      if (preview instanceof HTMLElement) preview.style.background = normalized;
      persistAllDebounced();
    }
  });

  personsListEl?.addEventListener('click', (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button') : null;
    if (!(btn instanceof HTMLElement)) return;

    const row = btn.closest('.person-row');
    if (!(row instanceof HTMLElement)) return;
    const pid = row.dataset.personId || '';

    if (btn.classList.contains('person-palette-button')) {
      const input = row.querySelector('.person-color-input');
      if (input instanceof HTMLInputElement) openPaletteFor(input);
      return;
    }

    if (btn.classList.contains('person-delete-button')) {
      if (!pid) return;
      delete personsState[pid];
      renderPersons();
      persistNow()
        .then(() => setStatus(`Personne ${pid} supprimée.`))
        .catch(() => setStatus(`Personne ${pid} supprimée (écriture en cours).`));
    }
  });

  opacityInput?.addEventListener('input', () => {
    const v = Number(opacityInput.value);
    highlightOpacity = Number.isFinite(v) ? v : 0.28;
    updateOpacityValueText(highlightOpacity);
    persistAllDebounced();
  });

  openPaletteNewButton?.addEventListener('click', () => {
    if (newColorInput instanceof HTMLInputElement) openPaletteFor(newColorInput);
  });

  newColorInput?.addEventListener('input', () => {
    setPreview(newColorPreviewEl, newColorInput.value);
  });

  addPersonButton?.addEventListener('click', async () => {
    const storageApi = getStorageApi();
    if (!storageApi) return;

    const pidRaw = String(newPersonIdInput?.value || '').trim();
    if (!/^\d+$/.test(pidRaw)) {
      setStatus('Person ID invalide (chiffres uniquement).');
      return;
    }

    const pid = pidRaw;
    const description = String(newDescriptionInput?.value || '').trim();
    const enabled = !!newEnabledInput?.checked;
    const color = normalizeHexColor(newColorInput?.value) || '#ffeb3b';

    personsState[pid] = { enabled, description, color };
    renderPersons();
    setStatus('Personne enregistrée.');
    try {
      await storageSet(storageApi, { persons: personsState, highlightOpacity });
    } catch {
      // ignore
    }
  });

  clearAllButton?.addEventListener('click', async () => {
    const storageApi = getStorageApi();
    if (!storageApi) return;

    personsState = {};
    renderPersons();
    setStatus('Tout vidé.');
    try {
      await storageSet(storageApi, { persons: personsState, highlightOpacity });
    } catch {
      // ignore
    }
  });

  closePaletteButton?.addEventListener('click', closePalette);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePalette();
  });
  document.addEventListener('mousedown', (e) => {
    if (!(palettePopoverEl instanceof HTMLElement)) return;
    if (palettePopoverEl.hidden) return;
    if (!(e.target instanceof Node)) return;
    if (palettePopoverEl.contains(e.target)) return;
    closePalette();
  });

  async function load() {
    const storageApi = getStorageApi();
    if (!storageApi) {
      setStatus('Erreur: stockage indisponible.');
      return;
    }

    const result = await storageGet(storageApi, ['persons', 'personIds', 'highlightColor', 'highlightOpacity']);

    const opacityNum = Number(result?.highlightOpacity);
    highlightOpacity = Number.isFinite(opacityNum) ? opacityNum : 0.28;
    updateOpacityValueText(highlightOpacity);
    if (opacityInput instanceof HTMLInputElement) opacityInput.value = String(highlightOpacity);

    const persons = result?.persons;
    // Treat `persons` as source of truth even if it's an empty object.
    const hasPersonsSchema = persons && typeof persons === 'object' && !Array.isArray(persons);

    personsState = {};
    if (hasPersonsSchema) {
      for (const [rawPid, cfg] of Object.entries(persons)) {
        const pid = String(rawPid);
        if (!/^\d+$/.test(pid)) continue;
        const enabled = cfg?.enabled !== false;
        const description = cfg?.description || '';
        const color = normalizeHexColor(cfg?.color) || '#ffeb3b';
        personsState[pid] = { enabled, description, color };
      }
    } else {
      // Migration from old schema.
      const migratedColor = normalizeHexColor(result?.highlightColor) || '#ffeb3b';
      const personIds = result?.personIds;
      const list = Array.isArray(personIds)
        ? personIds.map(String)
        : String(personIds || '').split(/[\s,;]+/).map((s) => String(s).trim());

      for (const pid of list) {
        if (!/^\d+$/.test(pid)) continue;
        personsState[pid] = { enabled: true, description: '', color: migratedColor };
      }
    }

    renderPersons();

    // Defaults for new person form.
    const defaultColor = '#ffeb3b';
    if (newColorInput instanceof HTMLInputElement) {
      if (!newColorInput.value) newColorInput.value = defaultColor;
      setPreview(newColorPreviewEl, newColorInput.value || defaultColor);
    }
    setStatus('OK.');
  }

  buildPalette();
  renderPersons();
  load().catch(() => setStatus('Erreur au chargement.'));
})();


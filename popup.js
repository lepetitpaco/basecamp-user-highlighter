// Popup: the highlighted people, the people seen in the current tab, and the display options.
// Colors are picked inline: a native color picker closes the popup.
(async () => {
  'use strict';

  const ORIGINS = ['https://app.basecamp.com/*', 'https://3.basecamp.com/*'];
  const byId = id => document.getElementById(id);
  let { persons, opacity, settings, people: known } = await bhLoad();
  let people = [];
  let paletteFor = null;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function iconButton(symbol, label, onClick) {
    const button = element('button', 'icon', symbol);
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', onClick);
    return button;
  }

  async function fetchPeople() {
    try {
      const [tab] = await bhApi().tabs.query({ active: true, currentWindow: true });
      people = (await bhApi().tabs.sendMessage(tab.id, { type: 'page-people' })) || [];
    } catch {
      // Not a Basecamp tab
      people = null;
    }
  }

  function savePersons() {
    return bhSave({ persons });
  }

  function hsvToHex(h, s, v) {
    const channel = n => {
      const k = (n + h / 60) % 6;
      const value = v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)));
      return Math.round(value * 255).toString(16).padStart(2, '0');
    };
    return `#${channel(5)}${channel(3)}${channel(1)}`;
  }

  function hexToHsv(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(value => value / 255);
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    let h = 0;
    if (delta) {
      if (max === r) h = ((g - b) / delta + 6) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    return [h * 60, max ? delta / max : 0, max];
  }

  // Inline color picker: saved while dragging, a little later to spare the storage
  function colorPicker(person, dot) {
    let [h, s, v] = hexToHsv(person.color);
    let saveTimer;
    const picker = element('div', 'picker');
    const area = element('div', 'picker-area');
    const handle = element('span', 'picker-handle');
    area.append(handle);
    const hue = element('input', 'picker-hue');
    hue.type = 'range';
    hue.min = 0;
    hue.max = 360;
    hue.value = h;
    hue.setAttribute('aria-label', 'Hue');
    const hex = element('input', 'picker-hex');
    hex.value = person.color;
    hex.spellcheck = false;
    hex.maxLength = 7;
    hex.setAttribute('aria-label', 'Hex color');

    function show() {
      area.style.backgroundColor = `hsl(${h} 100% 50%)`;
      handle.style.left = `${s * 100}%`;
      handle.style.top = `${(1 - v) * 100}%`;
      dot.style.background = person.color;
      dot.style.borderColor = person.color;
    }

    function commit(color) {
      person.color = color;
      show();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(savePersons, 120);
    }

    function fromHsv() {
      const color = hsvToHex(h, s, v);
      hex.value = color;
      commit(color);
    }

    function pick(event) {
      const box = area.getBoundingClientRect();
      s = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
      v = 1 - Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
      fromHsv();
    }

    area.addEventListener('pointerdown', event => {
      area.setPointerCapture(event.pointerId);
      pick(event);
    });
    area.addEventListener('pointermove', event => {
      if (area.hasPointerCapture(event.pointerId)) pick(event);
    });
    hue.addEventListener('input', () => {
      h = Number(hue.value);
      fromHsv();
    });
    hex.addEventListener('input', () => {
      const color = bhNormalizeColor(hex.value);
      if (!color) return;
      [h, s, v] = hexToHsv(color);
      hue.value = h;
      commit(color);
    });

    show();
    picker.append(area, hue, hex);
    return picker;
  }

  function renderPersons() {
    const list = byId('persons');
    const focused = document.activeElement?.dataset?.person;
    list.replaceChildren();
    const ids = Object.keys(persons).sort((a, b) =>
      (persons[a].description || a).localeCompare(persons[b].description || b));
    if (!ids.length) {
      list.append(element('div', 'hint', 'Nobody yet. Click someone below, or right-click an avatar in Basecamp.'));
    }
    for (const id of ids) {
      const person = persons[id];
      const row = element('div', `person${person.enabled ? '' : ' off'}`);

      const dot = element('button', 'dot');
      dot.type = 'button';
      dot.style.background = person.color;
      dot.title = 'Change color';
      dot.setAttribute('aria-label', 'Change color');
      dot.style.borderColor = person.color;
      if (known[id]?.avatar) dot.append(avatarImage(known[id].avatar));
      dot.addEventListener('click', () => {
        paletteFor = paletteFor === id ? null : id;
        renderPersons();
      });

      const name = element('input', 'name');
      name.value = person.description;
      name.placeholder = id;
      name.spellcheck = false;
      name.dataset.person = id;
      name.setAttribute('aria-label', 'Name');
      name.addEventListener('change', () => {
        person.description = name.value.trim();
        savePersons();
      });

      row.append(dot, name);
      const seen = people?.find(item => item.id === id);
      if (seen) {
        const count = element('span', 'count', seen.tasks);
        count.title = `Tasks on this page: ${seen.tasks}`;
        row.append(count);
      }

      const toggle = element('label', 'switch');
      toggle.title = person.enabled ? 'Pause' : 'Resume';
      const input = element('input');
      input.type = 'checkbox';
      input.checked = person.enabled;
      input.setAttribute('aria-label', 'Highlight this person');
      input.addEventListener('change', () => {
        person.enabled = input.checked;
        savePersons();
        renderPersons();
      });
      toggle.append(input, element('span'));

      row.append(toggle, iconButton('×', 'Remove', () => {
        delete persons[id];
        savePersons();
        renderAll();
      }));
      list.append(row);

      if (paletteFor === id) {
        list.append(colorPicker(person, dot));
        const swatches = element('div', 'swatches');
        for (const color of BH_COLORS) {
          const swatch = element('button', color === person.color ? 'current' : '');
          swatch.type = 'button';
          swatch.style.background = color;
          swatch.setAttribute('aria-label', `Color ${color}`);
          swatch.addEventListener('click', () => {
            person.color = color;
            paletteFor = null;
            savePersons();
            renderPersons();
          });
          swatches.append(swatch);
        }
        list.append(swatches);
      }
    }
    if (focused) list.querySelector(`[data-person="${focused}"]`)?.focus();
  }

  function avatarImage(url) {
    const avatar = element('img', 'avatar');
    avatar.src = url;
    avatar.alt = '';
    return avatar;
  }

  // People on the current page first, then everyone met so far
  function quickAddPeople() {
    const merged = new Map(Object.entries(known).map(([id, person]) => [id, { id, ...person, tasks: 0, here: false }]));
    for (const person of people || []) merged.set(person.id, { ...person, here: true });
    // "Basecamp" is the account of its own automatic messages, not a teammate
    return [...merged.values()].filter(person => !persons[person.id] && person.name !== 'Basecamp')
      .sort((a, b) => b.here - a.here || b.tasks - a.tasks || a.name.localeCompare(b.name));
  }

  function renderPage() {
    const list = byId('page');
    const search = byId('search');
    list.replaceChildren();
    const all = quickAddPeople();
    search.hidden = all.length <= 8 && !search.value;
    const query = search.value.trim().toLowerCase();
    const shown = all.filter(person => person.name.toLowerCase().includes(query));
    if (!shown.length) {
      list.className = 'hint';
      list.textContent = query ? 'No results.'
        : people ? 'Nobody else yet. People you come across in Basecamp will show up here.'
          : 'Open a Basecamp page: people you come across will show up here.';
      return;
    }
    list.className = 'chips';
    for (const person of shown) {
      const label = person.name || person.id;
      const chip = element('button', `chip${person.here ? '' : ' away'}`);
      chip.type = 'button';
      chip.setAttribute('aria-label', `Highlight ${label}`);
      chip.title = person.here ? `Tasks on this page: ${person.tasks}` : 'Seen on another page';
      if (person.avatar) chip.append(avatarImage(person.avatar));
      chip.append(element('span', '', label));
      if (person.tasks) chip.append(element('span', 'count', person.tasks));
      chip.addEventListener('click', () => {
        persons[person.id] = { enabled: true, description: person.name, color: bhNextColor(persons) };
        // Straight to the color: the first thing one may want to change
        paletteFor = person.id;
        savePersons();
        renderAll();
      });
      list.append(chip);
    }
  }

  function renderAll() {
    renderPersons();
    renderPage();
  }

  for (const key of ['enabled', 'dimOthers', 'borderOnly']) {
    byId(key).checked = settings[key];
    byId(key).addEventListener('change', () => {
      settings = { ...settings, [key]: byId(key).checked };
      bhSave({ settings });
    });
  }

  byId('opacity').value = opacity;
  byId('opacity').addEventListener('input', () => {
    opacity = Number(byId('opacity').value);
    bhSave({ highlightOpacity: opacity });
  });

  // Firefox treats host permissions as optional: the user has to grant them
  if (!(await bhApi().permissions.contains({ origins: ORIGINS }))) {
    byId('access').hidden = false;
    byId('grant').addEventListener('click', async () => {
      if (await bhApi().permissions.request({ origins: ORIGINS })) byId('access').hidden = true;
    });
  }

  // A right-click in the page while the popup is open, or another window
  bhApi().storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes.persons) return;
    const stored = (await bhLoad()).persons;
    // Our own write comes back here: redrawing would break a drag in the color picker
    if (JSON.stringify(stored) === JSON.stringify(persons)) return;
    persons = stored;
    renderAll();
  });

  byId('search').addEventListener('input', renderPage);

  await fetchPeople();
  renderAll();
  // The page saves who it sees a moment after loading
  setTimeout(async () => {
    known = (await bhLoad()).people;
    renderAll();
  }, 700);
})();

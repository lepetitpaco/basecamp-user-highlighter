// Highlights the cards and to-dos assigned to the chosen people.
//
// Only the avatars in an assignee slot count: the "Added by" avatar and the subscribers
// also carry data-avatar-for-person-id.
(() => {
  'use strict';

  // Firefox injects open tabs by itself too: background.js would make it a second copy
  if (globalThis.bhHighlightLoaded) return;
  globalThis.bhHighlightLoaded = true;

  const TASK = 'article.kanban-card__wrap, li.todo, li.assignment';
  const AVATAR = '[data-avatar-for-person-id]';
  const ASSIGNEE_AVATAR = `.kanban-card__assignee ${AVATAR}, .task-details__assignee ${AVATAR}`;
  const HIGHLIGHT = 'bh-highlight';
  const DIM = 'bh-dim';
  const RING = 'bh-ring';
  const BORDER_ONLY = 'bh-border-only';
  const STYLE_ID = 'bh-style';

  const STYLE = `
    /* The tint goes under the content, so text and avatars keep their contrast */
    .${HIGHLIGHT} { position: relative; border-radius: 4px; }
    li.${HIGHLIGHT}, article.${HIGHLIGHT} > .kanban-card { background-image: var(--bh-fill) !important; }
    html.${BORDER_ONLY} li.${HIGHLIGHT}, html.${BORDER_ONLY} article.${HIGHLIGHT} > .kanban-card { background-image: none !important; }
    /* A ring cut out of a gradient: a card shared by two people shows both colors */
    .${HIGHLIGHT}::after {
      content: '';
      position: absolute;
      inset: 0;
      padding: 2px;
      border-radius: 4px;
      background: var(--bh-line);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
      pointer-events: none;
      /* Above the card, below Basecamp's top bar and dialogs */
      z-index: 5;
    }
    /* Says who, on a task with several assignees */
    .${RING} { outline: 2px solid var(--bh-ring); outline-offset: -2px; border-radius: 50%; }
    .${DIM} { opacity: .35; transition: opacity .15s; }
    .${DIM}:hover { opacity: 1; }
    #bh-toast {
      position: fixed;
      left: 50%;
      bottom: 64px;
      transform: translateX(-50%);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      background: #1c2a33;
      color: #fff;
      font: 600 14px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
      pointer-events: none;
    }
    #bh-toast i { width: 12px; height: 12px; border-radius: 50%; }
  `;

  let persons = {};
  let opacity = BH_DEFAULT_OPACITY;
  let settings = BH_DEFAULT_SETTINGS;
  let rightClicked = null;
  let known = {};
  let knownTimer;

  function personId(avatar) {
    return avatar.getAttribute('data-avatar-for-person-id') || '';
  }

  function personName(avatar) {
    return avatar.getAttribute('alt') || avatar.getAttribute('title') || '';
  }

  // Equal bands, one per color
  function stripes(colors, alpha) {
    if (colors.length === 1) return `linear-gradient(${bhRgba(colors[0], alpha)} 0 0)`;
    const stops = colors.map((color, i) => {
      const value = bhRgba(color, alpha);
      return `${value} ${(i / colors.length) * 100}% ${((i + 1) / colors.length) * 100}%`;
    });
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  function clear(element) {
    element.classList.remove(HIGHLIGHT);
    element.style.removeProperty('--bh-fill');
    element.style.removeProperty('--bh-line');
  }

  function refresh() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = STYLE;
      (document.head || document.documentElement).append(style);
    }
    document.documentElement.classList.toggle(BORDER_ONLY, settings.borderOnly);

    rememberPeople();

    const wanted = new Map();
    const rings = new Map();
    if (settings.enabled) {
      for (const avatar of document.querySelectorAll(ASSIGNEE_AVATAR)) {
        const person = persons[personId(avatar)];
        const task = avatar.closest(TASK);
        if (!person?.enabled || !task) continue;
        rings.set(avatar, person.color);
        if (!wanted.has(task)) wanted.set(task, new Set());
        wanted.get(task).add(person.color);
      }
    }

    // Also clears what a Turbo snapshot brought back or an unassigned person left behind
    for (const element of document.querySelectorAll(`.${HIGHLIGHT}`)) {
      if (!wanted.has(element)) clear(element);
    }
    for (const [task, colorSet] of wanted) {
      const colors = [...colorSet];
      task.classList.add(HIGHLIGHT);
      task.style.setProperty('--bh-fill', stripes(colors, opacity));
      task.style.setProperty('--bh-line', stripes(colors, 1));
    }

    for (const avatar of document.querySelectorAll(`.${RING}`)) {
      if (!rings.has(avatar)) {
        avatar.classList.remove(RING);
        avatar.style.removeProperty('--bh-ring');
      }
    }
    for (const [avatar, color] of rings) {
      avatar.classList.add(RING);
      avatar.style.setProperty('--bh-ring', color);
    }

    const dimming = settings.enabled && settings.dimOthers && wanted.size > 0;
    for (const task of document.querySelectorAll(TASK)) {
      // A wrapper around another task, or the header of a to-do's own page: not a task to dim
      const skip = task.querySelector(TASK) || task.querySelector('.perma-header');
      task.classList.toggle(DIM, dimming && !skip && !wanted.has(task));
    }
  }

  // Directory of the people met so far, for the popup's quick add
  function rememberPeople() {
    let changed = false;
    for (const avatar of document.querySelectorAll(AVATAR)) {
      const id = personId(avatar);
      const name = personName(avatar);
      const src = avatar.getAttribute('src') || '';
      if (!id || !name) continue;
      if (known[id]?.name !== name || known[id]?.avatar !== src) {
        known[id] = { name, avatar: src };
        changed = true;
      }
    }
    if (changed) {
      clearTimeout(knownTimer);
      knownTimer = setTimeout(() => bhSave({ people: known }), 500);
    }
  }

  async function reload() {
    ({ persons, opacity, settings, people: known } = await bhLoad());
    refresh();
  }

  function showToast(text, color) {
    document.getElementById('bh-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'bh-toast';
    const dot = document.createElement('i');
    dot.style.background = color;
    toast.append(dot, text);
    document.body.append(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  // Right-click menu: adds the person with a free color, or removes them
  async function togglePerson() {
    const avatar = rightClicked;
    const id = avatar && personId(avatar);
    if (!id) {
      showToast('Faites un clic droit sur l’avatar d’une personne pour la surligner', '#90a4ae');
      return;
    }
    const current = await bhLoad();
    const name = personName(avatar) || id;
    if (current.persons[id]) {
      const { color } = current.persons[id];
      delete current.persons[id];
      showToast(`${name} n’est plus surligné·e`, color);
    } else {
      const color = bhNextColor(current.persons);
      current.persons[id] = { enabled: true, description: personName(avatar), color };
      showToast(`${name} est surligné·e`, color);
    }
    await bhSave({ persons: current.persons });
  }

  // For the popup: everyone seen on the page, and how many tasks each one has
  function pagePeople() {
    const people = new Map();
    for (const avatar of document.querySelectorAll(AVATAR)) {
      const id = personId(avatar);
      if (id && !people.has(id)) {
        people.set(id, { id, name: personName(avatar), avatar: avatar.getAttribute('src') || '', tasks: 0 });
      }
    }
    for (const avatar of document.querySelectorAll(ASSIGNEE_AVATAR)) {
      const person = people.get(personId(avatar));
      if (person && avatar.closest(TASK)) person.tasks++;
    }
    return [...people.values()];
  }

  document.addEventListener('contextmenu', event => {
    rightClicked = event.target instanceof Element ? event.target.closest(AVATAR) : null;
  }, true);

  bhApi().runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'toggle-person') togglePerson();
    if (message?.type === 'page-people') sendResponse(pagePeople());
  });

  bhApi().storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && !(Object.keys(changes).length === 1 && changes.people)) reload();
  });

  // Development only: background.js ignores this outside an unpacked build
  document.addEventListener('basecamp-user-highlighter:dev-reload', () => {
    bhApi().runtime.sendMessage({ type: 'dev-reload' });
  });

  // Same, for tests: the items go through an attribute, as page events can't carry data on Firefox
  document.addEventListener('basecamp-user-highlighter:dev-storage', () => {
    bhApi().runtime.sendMessage({ type: 'dev-storage', items: JSON.parse(document.documentElement.dataset.bhDevStorage) });
  });

  // Turbo swaps content and lazy frames load the assignees: everything goes through here,
  // once per frame. refresh() doesn't add nodes (except its style, once), so it can't loop.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    // Extension updated: the new copy takes over, and this one must not fight it
    if (!bhApi().runtime?.id) {
      observer.disconnect();
      return;
    }
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // A new version may have changed the style of the one it replaces
  document.getElementById(STYLE_ID)?.remove();
  reload();
})();

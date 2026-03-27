(() => {
  // Basecamp has multiple "task containers" depending on the page.
  // - Kanban: article.kanban-card__wrap
  // - Todolists (todos): li.todo
  // - My assignments: li.assignment (todo + kanban)
  const KANBAN_CARD_SELECTOR = 'article.kanban-card__wrap';
  const TODO_SELECTOR = 'li.todo';
  const ASSIGNMENT_SELECTOR = 'li.assignment';
  const HIGHLIGHT_CONTAINER_SELECTOR = `${KANBAN_CARD_SELECTOR}, ${TODO_SELECTOR}, ${ASSIGNMENT_SELECTOR}`;
  const AVATAR_SELECTOR = '[data-avatar-for-person-id]';

  const STYLE_ID = 'bc-person-highlight-style';
  const root = document.documentElement;

  function ensureStyleInjected() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bc-person-highlight {
        position: relative;
      }

      /* Overlay au-dessus du contenu (Basecamp peut mettre des éléments par-dessus). */
      .bc-person-highlight::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--bc-highlight-overlay, rgba(255, 235, 59, 0.35));
        border: 2px solid var(--bc-highlight-outline, rgba(255, 193, 7, 0.65));
        border-radius: inherit;
        pointer-events: none;
        /* Reste au-dessus du contenu de la carte, mais sous le bandeau Hey / modales (z-index global élevé). */
        z-index: 5;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(255, 235, 59, ${alpha})`;
    let h = String(hex).trim();
    if (h[0] === '#') h = h.slice(1);

    // #RGB -> #RRGGBB
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6) return `rgba(255, 235, 59, ${alpha})`;

    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(255, 235, 59, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getStorageApi() {
    // Firefox: browser.*. Just in case, fallback to chrome.*.
    if (typeof browser !== 'undefined' && browser?.storage) return browser.storage;
    if (typeof chrome !== 'undefined' && chrome?.storage) return chrome.storage;
    throw new Error('WebExtension storage API not found');
  }

  const storage = getStorageApi();

  function storageGet(keys) {
    try {
      const maybe = storage.local.get(keys);
      if (maybe && typeof maybe.then === 'function') return maybe;
    } catch {
      // fallback callback API below
    }

    return new Promise((resolve, reject) => {
      try {
        storage.local.get(keys, (result) => resolve(result || {}));
      } catch (e) {
        reject(e);
      }
    });
  }

  const state = {
    // Map personId -> computed overlay colors for current opacity.
    personStyles: new Map(),
    enabledPersonIds: new Set(),

    defaultColor: '#ffeb3b',
    highlightOpacity: 0.28,
  };

  function applyCssVars() {
    // Sans personne activée : ne pas laisser de variables "jaune par défaut" sur <html>
    // (sinon ça peut prêter à confusion, et le CSS a déjà un fallback sur .bc-person-highlight::before).
    if (state.enabledPersonIds.size === 0) {
      root.style.removeProperty('--bc-highlight-overlay');
      root.style.removeProperty('--bc-highlight-outline');
      return;
    }
    const overlay = hexToRgba(state.defaultColor, state.highlightOpacity);
    const outline = hexToRgba(state.defaultColor, Math.min(1, state.highlightOpacity + 0.27));
    root.style.setProperty('--bc-highlight-overlay', overlay);
    root.style.setProperty('--bc-highlight-outline', outline);
  }

  function getTargetForAvatar(img) {
    return (
      img.closest(KANBAN_CARD_SELECTOR) ||
      img.closest(TODO_SELECTOR) ||
      img.closest(ASSIGNMENT_SELECTOR)
    );
  }

  function getPersonIdFromAvatarElement(el) {
    if (!(el instanceof Element)) return '';
    const direct = el.getAttribute('data-avatar-for-person-id') ?? el.dataset?.avatarForPersonId ?? '';
    if (direct) return String(direct);
    const wrapped = el.closest?.('[data-avatar-for-person-id]');
    if (!wrapped) return '';
    return String(wrapped.getAttribute('data-avatar-for-person-id') ?? wrapped.dataset?.avatarForPersonId ?? '');
  }

  function highlightTarget(target, personStyle) {
    if (!(target instanceof HTMLElement)) return;
    if (personStyle?.overlay && personStyle?.outline) {
      target.style.setProperty('--bc-highlight-overlay', personStyle.overlay);
      target.style.setProperty('--bc-highlight-outline', personStyle.outline);
    }
    target.classList.add('bc-person-highlight');
  }

  function clearAllHighlights() {
    // Safer than relying on selectors: just remove our class everywhere.
    for (const el of document.querySelectorAll('.bc-person-highlight')) {
      el.classList.remove('bc-person-highlight');
      el.style.removeProperty('--bc-highlight-overlay');
      el.style.removeProperty('--bc-highlight-outline');
    }
  }

  function findMatchingPersonStyleInContainer(container) {
    if (!(container instanceof Element)) return null;
    const avatars = container.querySelectorAll(AVATAR_SELECTOR);
    for (const avatarEl of avatars) {
      const pid = getPersonIdFromAvatarElement(avatarEl);
      if (!state.enabledPersonIds.has(pid)) continue;
      const personStyle = state.personStyles.get(pid);
      if (!personStyle) continue;
      return personStyle;
    }
    return null;
  }

  function refreshAllCards() {
    if (state.enabledPersonIds.size === 0) {
      clearAllHighlights();
      return;
    }
    // Avoid stale highlights across markup variations/options changes.
    clearAllHighlights();

    const targets = new Map(); // target -> personStyle
    const containers = document.querySelectorAll(HIGHLIGHT_CONTAINER_SELECTOR);

    for (const container of containers) {
      const personStyle = findMatchingPersonStyleInContainer(container);
      if (!personStyle) continue;
      targets.set(container, personStyle);
    }

    for (const [target, personStyle] of targets) highlightTarget(target, personStyle);
  }

  function setupMutationObserver() {
    if (!document.documentElement) return;

    // Batch DOM updates and process once per frame.
    let scheduled = false;
    const pendingNodes = new Set();
    const pendingTargets = new Map(); // target -> personStyle

    function queueCard(target, personStyle) {
      if (target instanceof HTMLElement && personStyle?.overlay && personStyle?.outline) {
        if (!pendingTargets.has(target)) pendingTargets.set(target, personStyle);
      }
    }

    function queueContainer(container) {
      if (!(container instanceof HTMLElement)) return;
      const personStyle = findMatchingPersonStyleInContainer(container);
      if (!personStyle) return;
      queueCard(container, personStyle);
    }

    function queueFromNode(node) {
      if (!(node instanceof HTMLElement)) return;

      if (state.enabledPersonIds.size === 0) return;

      // Si un avatar arrive seul dans un conteneur existant.
      if (node.matches?.(AVATAR_SELECTOR)) {
        const pid = getPersonIdFromAvatarElement(node);
        if (state.enabledPersonIds.has(pid)) {
          const personStyle = state.personStyles.get(pid);
          const target = getTargetForAvatar(node);
          queueCard(target, personStyle);
        }
      }

      const closestContainer = node.closest?.(HIGHLIGHT_CONTAINER_SELECTOR);
      if (closestContainer) queueContainer(closestContainer);
      if (!node.querySelectorAll) return;
      for (const container of node.querySelectorAll(HIGHLIGHT_CONTAINER_SELECTOR)) queueContainer(container);
    }

    function flush() {
      scheduled = false;
      if (pendingNodes.size) {
        for (const node of pendingNodes) queueFromNode(node);
        pendingNodes.clear();
      }
      if (!pendingTargets.size) return;
      for (const [target, personStyle] of pendingTargets) highlightTarget(target, personStyle);
      pendingTargets.clear();
    }

    const observer = new MutationObserver((mutations) => {
      if (!mutations?.length) return;

      for (const m of mutations) {
        if (m.type !== 'childList') continue;
        if (!m.addedNodes || m.addedNodes.length === 0) continue;

        for (const node of m.addedNodes) {
          if (node?.nodeType !== 1) continue;
          pendingNodes.add(node);
        }
      }
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    });

    // Observe on documentElement to survive Turbo replacements of <body>.
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Turbo (Turbo Drive) can swap page content without full reload.
  // Trigger a refresh on those navigations to guarantee correct highlighting.
  let turboRefreshTimer = null;
  function scheduleTurboRefresh() {
    if (turboRefreshTimer) clearTimeout(turboRefreshTimer);
    turboRefreshTimer = setTimeout(() => {
      turboRefreshTimer = null;
      // Re-sync settings on Turbo navigations; avoids stale/empty initial state.
      loadSettings().catch(() => {
        refreshAllCards();
      });
    }, 100);
  }

  function parsePersonIds(value) {
    // Stored as array of strings. Accept string too for robustness.
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    return [String(value)].flatMap((s) => s.split(/[\s,;]+/)).map(String).filter(Boolean);
  }

  async function loadSettings() {
    ensureStyleInjected();

    // Supported storage schemas (backward compatible):
    // - New: persons: { [personId]: { enabled, description, color } }
    // - Old: personIds + highlightColor (global) + highlightOpacity
    const result = await storageGet(['persons', 'personIds', 'highlightColor', 'highlightOpacity']);

    const opacityNum = Number(result?.highlightOpacity);
    state.highlightOpacity = Number.isFinite(opacityNum) ? opacityNum : state.highlightOpacity;

    state.personStyles.clear();
    state.enabledPersonIds.clear();

    const persons = result?.persons;
    // Treat `persons` as the source of truth even if it's an empty object.
    // Otherwise we would fallback to the legacy `personIds` array and deleted people would "come back".
    const hasPersons = persons && typeof persons === 'object' && !Array.isArray(persons);

    if (hasPersons) {
      for (const [rawPid, cfg] of Object.entries(persons)) {
        const pid = String(rawPid);
        const enabled = cfg?.enabled !== false; // default: true
        if (!enabled) continue;

        const color = cfg?.color || state.defaultColor;
        // Ensure numeric-like ids work (avatars are strings anyway).
        if (!pid) continue;

        const overlay = hexToRgba(color, state.highlightOpacity);
        const outline = hexToRgba(color, Math.min(1, state.highlightOpacity + 0.27));

        state.personStyles.set(pid, { overlay, outline });
        state.enabledPersonIds.add(pid);
      }
    } else {
      const migratedColor = result?.highlightColor || state.defaultColor;
      state.defaultColor = migratedColor;

      for (const pid of parsePersonIds(result?.personIds)) {
        const overlay = hexToRgba(migratedColor, state.highlightOpacity);
        const outline = hexToRgba(migratedColor, Math.min(1, state.highlightOpacity + 0.27));

        state.personStyles.set(pid, { overlay, outline });
        state.enabledPersonIds.add(pid);
      }
    }

    // Toujours nettoyer le DOM avant d’appliquer le nouveau mode (évite un surlignage “fantôme”).
    clearAllHighlights();
    applyCssVars();
    refreshAllCards();
  }

  function bootstrapSettingsLoad(attempt = 0) {
    loadSettings()
      .catch(() => {
        // Ignore and retry below.
      })
      .finally(() => {
        // Retry briefly at startup in case storage/page state is delayed.
        if (attempt >= 3) return;
        if (state.enabledPersonIds.size > 0) return;
        setTimeout(() => bootstrapSettingsLoad(attempt + 1), 250 * (attempt + 1));
      });
  }

  // Initialize
  bootstrapSettingsLoad();

  // React on tab navigation or option changes.
  try {
    setupMutationObserver();

    // Some Basecamp screens use Turbo Drive / Turbo Frames.
    // Listen and reapply highlights after navigation.
    window.addEventListener('turbo:load', scheduleTurboRefresh, { passive: true });
    window.addEventListener('turbo:render', scheduleTurboRefresh, { passive: true });
    window.addEventListener('turbo:frame-load', scheduleTurboRefresh, { passive: true });
    window.addEventListener('pageshow', scheduleTurboRefresh, { passive: true });
    window.addEventListener('load', scheduleTurboRefresh, { passive: true });

    storage?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== 'local') return;
      const keys = Object.keys(changes || {});
      if (!keys.length) return;

      // If persons or styling changes, reload settings and reapply.
      if (keys.some((k) => k === 'persons' || k === 'highlightColor' || k === 'highlightOpacity' || k === 'personIds')) {
        loadSettings();
      }
    });
  } catch {
    // Ignore
  }
})();


// Settings and people, shared by the popup and the content script.
// Uses `var` and global functions: Firefox doesn't share `const` between content scripts.
//
// Storage (local), same keys as 1.0 so existing installs keep their people:
//   persons: { [personId]: { enabled, description, color } }
//   highlightOpacity: number
//   settings: { enabled, dimOthers, borderOnly }
//   people: { [personId]: { name, avatar } }, everyone met so far, for the quick add
var BH_DEFAULT_OPACITY = 0.28;
var BH_DEFAULT_SETTINGS = { enabled: true, dimOthers: false, borderOnly: false };
var BH_COLORS = [
  '#ffeb3b', '#ff9800', '#ef5350', '#f06292', '#ba68c8', '#7986cb',
  '#64b5f6', '#4dd0e1', '#4db6ac', '#66bb6a', '#aed581', '#a1887f',
];

function bhApi() {
  return globalThis.browser ?? globalThis.chrome;
}

function bhNormalizeColor(value) {
  let hex = String(value || '').trim().toLowerCase();
  if (hex && hex[0] !== '#') hex = `#${hex}`;
  if (/^#[0-9a-f]{3}$/.test(hex)) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
}

function bhRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// First color of the palette nobody uses yet, so people are told apart without any setup
function bhNextColor(persons) {
  const used = new Set(Object.values(persons).map(person => person.color));
  return BH_COLORS.find(color => !used.has(color)) || BH_COLORS[Object.keys(persons).length % BH_COLORS.length];
}

async function bhLoad() {
  const stored = await bhApi().storage.local.get(['persons', 'personIds', 'highlightColor', 'highlightOpacity', 'settings', 'people']);
  const persons = {};
  const isObject = stored.persons && typeof stored.persons === 'object' && !Array.isArray(stored.persons);
  if (isObject) {
    for (const [id, person] of Object.entries(stored.persons)) {
      persons[id] = {
        enabled: person?.enabled !== false,
        description: person?.description || '',
        color: bhNormalizeColor(person?.color) || BH_COLORS[0],
      };
    }
  } else {
    // Oldest format: a list of ids and a single color
    const ids = Array.isArray(stored.personIds) ? stored.personIds : String(stored.personIds || '').split(/[\s,;]+/);
    for (const id of ids.map(String).filter(Boolean)) {
      persons[id] = { enabled: true, description: '', color: bhNormalizeColor(stored.highlightColor) || BH_COLORS[0] };
    }
  }
  const opacity = Number(stored.highlightOpacity);
  return {
    persons,
    opacity: Number.isFinite(opacity) ? opacity : BH_DEFAULT_OPACITY,
    settings: { ...BH_DEFAULT_SETTINGS, ...stored.settings },
    people: stored.people || {},
  };
}

function bhSave(items) {
  return bhApi().storage.local.set(items);
}

const MENU_ADD_PERSON = 'bc-add-person';
const BASECAMP_PATTERNS = ['https://*.basecamp.com/*', 'https://3.basecamp.com/*'];
const DEFAULT_ADD_TITLE = 'Ajouter cette personne';

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ADD_PERSON,
      title: DEFAULT_ADD_TITLE,
      contexts: ['image'],
      documentUrlPatterns: BASECAMP_PATTERNS,
    });
  });
}

// Ensure stale/legacy menu entries are removed whenever worker starts.
createContextMenus();

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId !== MENU_ADD_PERSON) return;
  chrome.tabs.sendMessage(tab.id, { action: MENU_ADD_PERSON }, () => {
    // Ignore tabs without our content script.
    void chrome.runtime.lastError;
  });
});

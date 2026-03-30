const MENU_COPY_ID = 'bc-copy-person-id';
const MENU_ADD_PERSON = 'bc-add-person';
const BASECAMP_PATTERNS = ['https://*.basecamp.com/*', 'https://3.basecamp.com/*'];

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_COPY_ID,
      title: 'Copier ID personne',
      contexts: ['all'],
      documentUrlPatterns: BASECAMP_PATTERNS,
    });
    chrome.contextMenus.create({
      id: MENU_ADD_PERSON,
      title: 'Ajouter personne au surligneur',
      contexts: ['all'],
      documentUrlPatterns: BASECAMP_PATTERNS,
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId !== MENU_COPY_ID && info.menuItemId !== MENU_ADD_PERSON) return;

  const action = info.menuItemId === MENU_COPY_ID ? MENU_COPY_ID : MENU_ADD_PERSON;
  chrome.tabs.sendMessage(tab.id, { action }, () => {
    // Ignore tabs without our content script.
    void chrome.runtime.lastError;
  });
});

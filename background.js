// Right-click menu on avatars. The content script knows which avatar was clicked,
// so this only forwards the click. Also lets an unpacked build be reloaded from a
// Basecamp tab (document event "basecamp-user-highlighter:dev-reload"), and its storage set
// from there for tests ("basecamp-user-highlighter:dev-storage"). Both do nothing in store builds.
const api = globalThis.browser ?? globalThis.chrome;
const MENU_ID = 'bh-toggle-person';

const BASECAMP_PAGES = ['https://app.basecamp.com/*', 'https://3.basecamp.com/*'];

function createMenu() {
  api.contextMenus.removeAll(() => {
    api.contextMenus.create({
      id: MENU_ID,
      title: 'Highlight this person / stop highlighting',
      contexts: ['image'],
      documentUrlPatterns: BASECAMP_PAGES,
    });
  });
}

// After an install or an update, Chrome leaves the open tabs without a working content
// script: without this, they do nothing until reloaded
async function injectIntoOpenTabs() {
  for (const tab of await api.tabs.query({ url: BASECAMP_PAGES })) {
    api.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/settings.js', 'src/highlight.js'] }).catch(() => {});
  }
}

api.runtime.onInstalled.addListener(createMenu);
api.runtime.onInstalled.addListener(injectIntoOpenTabs);
api.runtime.onStartup.addListener(createMenu);

api.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  api.tabs.sendMessage(tab.id, { type: 'toggle-person' }).catch(() => {});
});

api.runtime.onMessage.addListener(message => {
  if (message?.type !== 'dev-reload' && message?.type !== 'dev-storage') return;
  api.management.getSelf().then(self => {
    if (self.installType !== 'development') return;
    if (message.type === 'dev-reload') api.runtime.reload();
    else api.storage.local.set(message.items);
  });
});

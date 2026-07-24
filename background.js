async function registerMenu() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: 'generatePromptCard',
    title: 'Generate PromptCard',
    contexts: ['image'],
  });
}

chrome.runtime.onInstalled.addListener(registerMenu);
registerMenu();

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'generatePromptCard') return;
  const imageUrl = info.srcUrl;
  if (!imageUrl) return;

  const { psid, psidts } = await chrome.storage.sync.get(['psid', 'psidts']);
  if (!psid || !psidts) {
    chrome.runtime.openOptionsPage();
    return;
  }

  await chrome.storage.session.set({ _pendingImage: imageUrl, _psid: psid, _psidts: psidts });
  await chrome.windows.create({
    url: chrome.runtime.getURL('progress.html'),
    type: 'popup',
    width: 560,
    height: 400,
  });
});

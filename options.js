const $ = id => document.getElementById(id);

async function load() {
  const { psid, psidts } = await chrome.storage.sync.get(['psid', 'psidts']);
  if (psid) $('psid').value = psid;
  if (psidts) $('psidts').value = psidts;
  update(psid, psidts);
}

async function update(psid, psidts) {
  const el = $('status');
  const a = psid ?? (await chrome.storage.sync.get('psid')).psid;
  const b = psidts ?? (await chrome.storage.sync.get('psidts')).psidts;
  if (a && b) {
    el.className = 'status ok';
    el.textContent = `✅ ${a.slice(0,10)}… / ${b.slice(0,10)}…`;
  } else if (a && !b) {
    el.className = 'status warn';
    el.textContent = '⚠ Missing GEMINI_1PSIDTS';
  } else {
    el.className = 'status warn';
    el.textContent = '⚠ Enter both cookies to use PromptCard.';
  }
}

$('save').addEventListener('click', async () => {
  const p1 = $('psid').value.trim();
  const p2 = $('psidts').value.trim();
  if (!p1 || !p2) return;
  await chrome.storage.sync.set({ psid: p1, psidts: p2 });
  update(p1, p2);
});

$('clear').addEventListener('click', async () => {
  $('psid').value = '';
  $('psidts').value = '';
  await chrome.storage.sync.remove(['psid', 'psidts']);
  update();
});

document.addEventListener('DOMContentLoaded', load);

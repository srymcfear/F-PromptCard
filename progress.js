const $ = s => document.querySelector(s);
const STEPS = 6;

function status(step, msg) {
  $('.bar').style.width = (step / STEPS * 100) + '%';
  $('.msg').textContent = msg;
}

function showResult(text) {
  $('#loading').classList.add('hide');
  $('#result').classList.remove('hide');
  $('#promptText').value = text;
  $('#charCount').textContent = `${text.length} chars`;
}

async function fetchImageBlob(url) {
  if (url.startsWith('data:')) {
    const resp = await fetch(url);
    return await resp.blob();
  }
  const resp = await fetch(url);
  if (!resp.ok) throw Error(`Image fetch HTTP ${resp.status}`);
  return await resp.blob();
}

$('#copyBtn').addEventListener('click', async () => {
  const text = $('#promptText').value;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  $('#copyBtn').textContent = 'Copied!';
  $('#copyBtn').classList.add('copied');
  setTimeout(() => {
    $('#copyBtn').textContent = 'Copy';
    $('#copyBtn').classList.remove('copied');
  }, 2000);
});

$('#closeBtn').addEventListener('click', () => window.close());

(async () => {
  try {
    const { _pendingImage, _psid, _psidts } = await chrome.storage.session.get(['_pendingImage', '_psid', '_psidts']);
    await chrome.storage.session.remove(['_pendingImage', '_psid', '_psidts']);
    if (!_pendingImage || !_psid || !_psidts) {
      status(0, 'Missing auth. Close and retry.');
      $('.msg').classList.add('err');
      return;
    }

    status(1, 'Fetching image…');
    const imgBlob = await fetchImageBlob(_pendingImage);
    const imgExt = (imgBlob.type || 'image/jpeg').split('/')[1] || 'jpg';
    const imgFileName = `image.${imgExt}`;

    status(2, 'Authenticating…');
    const cookieH = `__Secure-1PSID=${_psid}; __Secure-1PSIDTS=${_psidts}`;
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const initResp = await fetch('https://gemini.google.com/app', {
      headers: { Cookie: cookieH, 'User-Agent': ua },
    });
    if (!initResp.ok) throw Error(`Auth failed: ${initResp.status}`);
    const html = await initResp.text();
    const snlm0e = html.match(/"SNlM0e":"(.*?)"/)?.[1] || '';
    const buildLabel = html.match(/"cfb2h":"(.*?)"/)?.[1];
    if (!buildLabel) throw Error('Build label not found. Cookies may be expired.');

    status(3, 'Uploading image…');
    const fd = new FormData();
    fd.append('file', imgBlob, imgFileName);
    const uploadResp = await fetch('https://content-push.googleapis.com/upload', {
      method: 'POST',
      headers: {
        Cookie: cookieH,
        'X-Tenant-Id': 'bard-storage',
        'Push-ID': 'feeds/mcudyrk2a4khkz',
        Origin: 'https://gemini.google.com',
        Referer: 'https://gemini.google.com/',
      },
      body: fd,
    });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text().catch(() => '');
      throw Error(`Upload failed: ${uploadResp.status} ${errText}`);
    }
    const uploadedUrl = await uploadResp.text();

    status(4, 'Analyzing with Gemini…');
    const uuid = crypto.randomUUID().toUpperCase();
    const inner = new Array(69).fill(null);
    const sysPrompt = `You are a world-class Prompt Engineer for AI image generation (Midjourney, Stable Diffusion, DALL-E 3). Analyze this image and output a detailed English prompt using exactly this 5-part structure:

---Subject & Framing: [Comprehensive style description, main subject, face angle, expression, pose, framing, and any insets/supplementary elements].

Wardrobe & Styling: [Detailed outfit: style, materials, colors, patterns, design culture/reference, accessories].

Background & Graphic Design: [Detailed background, decorative patterns, texture effects (grain, paper texture...), typography (titles, signatures, quotes) if present].

Lighting & Color Palette: [Lighting style (warm, cool, dramatic...), contrast, dominant color palette, artistic style fusion (fashion photography, digital illustration...)].

Aspect Ratio & Quality: [Exact aspect ratio appropriate for the format, quality optimization keywords (ultra-high-resolution, commercial quality...)]---OUTPUT ONLY IN ENGLISH. Use vivid, descriptive language. Preserve the 5 section headers exactly.`;

    inner[0] = [
      sysPrompt,
      0, null, [[[uploadedUrl], imgFileName]], null, null, 0,
    ];
    inner[1] = ['en'];
    inner[2] = ['', '', '', null, null, null, null, null, null, ''];
    inner[6] = [0];
    inner[7] = 1;
    inner[10] = 1;
    inner[11] = 0;
    inner[17] = [[0]];
    inner[18] = 0;
    inner[27] = 1;
    inner[30] = [4];
    inner[41] = [2];
    inner[53] = 0;
    inner[59] = uuid;
    inner[61] = [];
    inner[68] = 1;

    const fReq = JSON.stringify([null, JSON.stringify(inner)]);
    const body = new URLSearchParams({ 'f.req': fReq });
    if (snlm0e) body.set('at', snlm0e);
    const genUrl = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${buildLabel}&hl=en&_reqid=100000&rt=c`;

    const genResp = await fetch(genUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Origin: 'https://gemini.google.com',
        Referer: 'https://gemini.google.com/',
        'X-Same-Domain': '1',
        Cookie: cookieH,
        'x-goog-ext-525001261-jspb': '[1,null,null,null,"fbb127bbb056c959",null,null,0,[4]]',
        'x-goog-ext-73010989-jspb': '[0]',
        'x-goog-ext-525005358-jspb': `["${uuid}",1]`,
      },
      body,
    });
    if (!genResp.ok) throw Error(`Gemini API: ${genResp.status}`);

    const raw = await genResp.text();
    let prompt = '';
    for (const line of raw.split('\n')) {
      if (!line.includes('"wrb.fr"') || line.length < 200) continue;
      try {
        const arr = JSON.parse(line);
        if (!arr?.[0]?.[2]) continue;
        const inner2 = JSON.parse(arr[0][2]);
        const text = inner2?.[4]?.[0]?.[1]?.[0];
        if (text) {
          prompt = text;
        }
      } catch {}
    }
    if (!prompt) throw Error('Empty response from Gemini');

    showResult(prompt);
  } catch (err) {
    status(0, err.message || 'Failed');
    $('.msg').classList.add('err');
  }
})();

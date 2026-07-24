# FPrompt — Image to Prompt AI

**made by SrymC — FEΔR**

Right-click any image → get a detailed style prompt for AI image generators (Midjourney, Stable Diffusion, DALL-E 3).

## Requirements

- Google account with access to [Gemini](https://gemini.google.com)
- Chrome browser

## Setup / Cài đặt

1. **Install** extension: `chrome://extensions` → Load unpacked → chọn thư mục
2. **Get cookies**: Vào https://gemini.google.com (đã đăng nhập), F12 → Application → Cookies → `gemini.google.com`, copy `__Secure-1PSID` và `__Secure-1PSIDTS`
3. **Configure**: Right-click extension icon → Options → dán 2 cookie → Save

## Usage / Sử dụng

Right-click any image → **Generate PromptCard** → chờ kết quả → Copy

## Tech / Kỹ thuật

- Gemini Web API (`StreamGenerate` endpoint) — không cần API key
- Cookie-based auth
- Chrome Extension MV3

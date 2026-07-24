# FPrompt — Image to Prompt AI

Right-click any image → get a detailed style prompt for AI image generators (Midjourney, Stable Diffusion, DALL-E 3).

## Requirements

- Google account with access to [Gemini](https://gemini.google.com)
- Chrome browser

## Setup

1. **Install** extension in Chrome via `chrome://extensions` → Load unpacked → select folder
2. **Get cookies**: Go to https://gemini.google.com (logged in), open DevTools → Application → Cookies → `gemini.google.com`, copy `__Secure-1PSID` and `__Secure-1PSIDTS`
3. **Configure**: Right-click extension icon → Options → paste both cookies → Save

## Usage

Right-click any image on any page → **Generate PromptCard** → wait for result → Copy

## Tech

- Uses Gemini Web API (`StreamGenerate` endpoint) — no API key needed
- Cookie-based auth only
- Chrome Extension MV3

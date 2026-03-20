# Clarity — SOAP Note Generator Build Task

Build a full-stack AI clinical note generator called "Clarity" per the spec in SPEC.md.

## Architecture
- Frontend: Single HTML page (index.html) — vanilla HTML/CSS/JS, desktop only
- Backend: Python FastAPI — single file (app.py), single endpoint POST /api/generate-note
- AI: OpenRouter API (NOT Anthropic directly) using model: anthropic/claude-sonnet-4-5

## Key Decisions
- Subdomain will be `clarity.bearingdigital.com` (therapyai is already in use)
- Backend runs locally, tunneled via ngrok for tonight's demo
- No API keys hardcoded anywhere
- OpenRouter base URL: https://openrouter.ai/api/v1 (OpenAI-compatible)
- Use the `openai` Python package pointed at OpenRouter, or `httpx` directly

## Backend (app.py)
- FastAPI + uvicorn
- CORS: allow all origins (demo only)
- Single endpoint: POST /api/generate-note
- Reads OPENROUTER_API_KEY from environment variable
- OpenRouter API call: POST https://openrouter.ai/api/v1/chat/completions
  - model: "anthropic/claude-sonnet-4-5"
  - max_tokens: 2000
  - temperature: 0.3
  - system + user messages as described in SPEC.md
- Parse JSON response from AI into sections (SOAP/DAP/BIRP)
- Return JSON: { format, sections, metadata }
- requirements.txt: fastapi, uvicorn, httpx, python-dotenv

## Frontend (index.html)
- Single HTML file with embedded CSS and JS (or separate files — your call)
- Three states: form / loading / note viewer
- Form exactly as specified in SPEC.md
- API call to /api/generate-note (use relative URL or http://localhost:8000)
- Note viewer with per-section edit capability
- Copy to Clipboard with "Copied!" confirmation
- Load Demo button pre-fills form with Alex R. demo data from spec
- Design: warm/calm/clinical — sage greens, cream/warm whites, DM Serif Display + DM Sans from Google Fonts
- CNAME file: clarity.bearingdigital.com

## Files to create
- index.html (frontend)
- styles.css (if separate)
- app.js (if separate)  
- app.py (backend)
- requirements.txt
- .env.example (with OPENROUTER_API_KEY=your_key_here)
- CNAME (containing: clarity.bearingdigital.com)
- start.sh (script to install deps and start uvicorn on port 8000)
- README.md (brief: how to run locally)

## DO NOT
- Hardcode any API keys
- Require auth or database
- Build for mobile

When completely finished, run this command to notify:
openclaw system event --text "Done: Clarity SOAP note generator built — frontend + backend ready" --mode now

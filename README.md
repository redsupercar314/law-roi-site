# law-roi-site

Law School ROI & Admissions Calculator — React + Vite port of the original single-file build.

## Quick start (Windows PowerShell)

```powershell
# 1. Install prerequisites (run once)
winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements
winget install --id Cloudflare.cloudflared -e --silent --accept-package-agreements --accept-source-agreements
# then CLOSE and REOPEN the terminal so node/git/cloudflared are on PATH

# 2. Run locally
npm install
npm run dev      # -> http://localhost:5173

# 3. Expose via Cloudflare Quick Tunnel (no domain needed)
.\tunnel-quick.ps1
# cloudflared prints a https://*.trycloudflare.com URL — share it.
```

## GitHub repo

```powershell
gh auth login
.\github-init.ps1   # inits git, commits, creates repo `law-roi-site`, pushes main
```

## Build

```powershell
npm run build      # outputs dist/
npm run preview    # serve dist/ locally on :5173
```

## Notes

- School dataset lives in `src/data/schools-raw.json` (151 schools) enriched at import time by
  `src/data/schools.js` with `barpass.js` / `barreq.js` / `verified.js` — same logic as the original file.
- All admissions/ROI math is pure functions in `src/lib/calc.js` (ported 1:1).
- Styling is the original stylesheet at `src/styles.css` (light + night mode).

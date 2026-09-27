# Quick Tunnel: exposes local Vite dev server on a public https URL. No domain needed.
# Usage: npm run dev (in another terminal), then .\tunnel-quick.ps1
$ErrorActionPreference = 'Stop'
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error 'cloudflared not found. Install: winget install --id Cloudflare.cloudflared -e --silent --accept-package-agreements --accept-source-agreements'
}
cloudflared tunnel --url http://localhost:5173

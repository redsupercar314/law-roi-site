# Creates the GitHub repo `law-roi-site` and pushes this project.
# Usage: gh auth login  (once), then .\github-init.ps1 [-Private]
param([switch]$Private)
$ErrorActionPreference = 'Stop'
foreach ($cmd in @('git', 'gh')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "$cmd not found. Install Git + GitHub CLI, then reopen the terminal."
  }
}
if (-not (Test-Path .git)) { git init }
git add -A
git commit -m 'Initial commit: React + Vite port of law school ROI calculator' 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host '(nothing new to commit or already committed)' }
git branch -M main
$vis = if ($Private) { '--private' } else { '--public' }
gh repo create law-roi-site $vis --source=. --push

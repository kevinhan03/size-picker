$ErrorActionPreference = "Stop"

$sourceDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $env:LOCALAPPDATA "size-picker-runtime"

if (!(Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

# Mirror project files into an ASCII-only runtime path.
robocopy $sourceDir $runtimeDir /MIR /XD .git node_modules dist .vite | Out-Null
$rc = $LASTEXITCODE
if ($rc -gt 7) {
  throw "robocopy failed with exit code $rc"
}

Push-Location $runtimeDir
try {
  $lockFile = Join-Path $runtimeDir "package-lock.json"
  $stampFile = Join-Path $runtimeDir ".deps-lock.sha256"
  $needsInstall = !(Test-Path (Join-Path $runtimeDir "node_modules"))

  if (Test-Path $lockFile) {
    $currentHash = (Get-FileHash $lockFile -Algorithm SHA256).Hash
    $prevHash = if (Test-Path $stampFile) { (Get-Content $stampFile -Raw).Trim() } else { "" }
    if ($currentHash -ne $prevHash) {
      $needsInstall = $true
    }
  } else {
    $needsInstall = $true
  }

  if ($needsInstall) {
    npm install --ignore-scripts
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE"
    }
    if (Test-Path $lockFile) {
      (Get-FileHash $lockFile -Algorithm SHA256).Hash | Set-Content -Path $stampFile -Encoding ascii
    }
  }

  node scripts/run-vite.mjs dev @args
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}

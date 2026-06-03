# SPOVO - build APK and copy a fresh file to the Desktop.
# Run:  right-click -> "Run with PowerShell"
#   or: powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
# (ASCII-only on purpose: Windows PowerShell 5.1 mangles non-BOM Cyrillic in .ps1)
$ErrorActionPreference = "Stop"

$JavaHome = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
$SdkDir   = "C:\Android\sdk"
$Src      = Split-Path -Parent $MyInvocation.MyCommand.Path  # this android-app folder
$Build    = "C:\spovo-android"   # ASCII build dir (no Cyrillic in path!)
$Desktop  = [Environment]::GetFolderPath("Desktop")

Write-Host "== SPOVO: building APK ==" -ForegroundColor Cyan
Write-Host "src: $Src"

# 1) Sync sources into the ASCII build dir (keep .gradle/build caches for speed)
robocopy $Src $Build /E /XD .gradle build .idea /XF local.properties build-apk.ps1 | Out-Null

# 2) local.properties with the Android SDK path
"sdk.dir=" + ($SdkDir -replace '\\','\\' -replace ':','\:') | Out-File "$Build\local.properties" -Encoding ascii

# 3) Build
$env:JAVA_HOME = $JavaHome
Push-Location $Build
& "$Build\gradlew.bat" assembleDebug
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Write-Host "BUILD FAILED (exit $code)" -ForegroundColor Red; exit $code }

# 4) Copy fresh APK to the Desktop
$apk = Get-ChildItem -Recurse "$Build\app\build\outputs\apk\debug" -Filter *.apk | Select-Object -First 1
if (-not $apk) { Write-Host "APK not found" -ForegroundColor Red; exit 1 }

$stamp   = Get-Date -Format "yyyy-MM-dd_HH-mm"
$histDir = Join-Path $Desktop "SPOVO-apk"
New-Item -ItemType Directory -Force -Path $histDir | Out-Null

Copy-Item $apk.FullName (Join-Path $Desktop "SPOVO.apk") -Force
Copy-Item $apk.FullName (Join-Path $histDir "SPOVO_$stamp.apk") -Force

$mb = [math]::Round($apk.Length/1MB,2)
Write-Host ""
Write-Host "DONE  ($mb MB)" -ForegroundColor Green
Write-Host "  Desktop:  SPOVO.apk"
Write-Host "  History:  SPOVO-apk\SPOVO_$stamp.apk"

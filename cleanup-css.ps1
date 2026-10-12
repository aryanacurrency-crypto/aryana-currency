# ARYANA CURRENCY — Cleanup CSS

$ErrorActionPreference = "Stop"
$root = "C:\Users\ShirzadPC\Desktop\ARYANA\frontend\assets\css"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " ARYANA CURRENCY - Cleanup CSS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Ensure all v2 files are copied from v2/ folder
Write-Host "Step 1: Ensuring all v2 files are copied..." -ForegroundColor Yellow

$v2Folder = Join-Path $root "v2"
$filesToCopy = @{
    "theme.css" = "theme-v2.css"
    "ui.css" = "ui-v2.css"
    "dashboard.css" = "dashboard-v2.css"
    "profile.css" = "profile-v2.css"
    "exchange.css" = "exchange-v2.css"
    "orders.css" = "orders-v2.css"
    "order.css" = "order-v2.css"
    "deposit.css" = "deposit-v2.css"
    "admin-v2.css" = "admin-v2.css"
    "content.css" = "content-v2.css"
    "auth.css" = "auth-v2.css"
}

if (Test-Path $v2Folder) {
    foreach ($src in $filesToCopy.Keys) {
        $srcPath = Join-Path $v2Folder $src
        $destPath = Join-Path $root $filesToCopy[$src]
        
        if (Test-Path $srcPath) {
            Copy-Item $srcPath $destPath -Force
            Write-Host "  Ensured: $($filesToCopy[$src])" -ForegroundColor Gray
        }
    }
}

# STEP 2: Remove old v1 CSS files
Write-Host ""
Write-Host "Step 2: Removing old v1 CSS files..." -ForegroundColor Yellow

$oldFiles = @(
    "admin.css",
    "auth.css",
    "components.css",
    "dashboard.css",
    "exchange.css",
    "main.css",
    "order.css",
    "orders.css",
    "profile.css",
    "content.css"
)

foreach ($file in $oldFiles) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  Removed: $file" -ForegroundColor Gray
    }
}

# STEP 3: Remove v2 folder (we already copied files out)
Write-Host ""
Write-Host "Step 3: Removing v2 folder..." -ForegroundColor Yellow

if (Test-Path $v2Folder) {
    Remove-Item $v2Folder -Recurse -Force
    Write-Host "  Removed: v2/" -ForegroundColor Gray
}

# STEP 4: List remaining
Write-Host ""
Write-Host "Step 4: Final CSS files:" -ForegroundColor Green

$remaining = Get-ChildItem -Path $root -Filter "*.css"
foreach ($file in $remaining) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host " CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
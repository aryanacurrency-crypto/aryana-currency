# ARYANA CURRENCY — Migrate CSS v2 to v1

$ErrorActionPreference = "Stop"
$root = "C:\Users\ShirzadPC\Desktop\ARYANA\frontend"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " ARYANA CURRENCY - Migrate CSS v2 to v1" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: List what we have in v2
Write-Host "Step 1: Checking CSS files in v2 folder..." -ForegroundColor Yellow

$v2CssDir = Join-Path $root "assets\css\v2"
if (-not (Test-Path $v2CssDir)) {
    Write-Host "  ERROR: v2 CSS folder not found!" -ForegroundColor Red
    exit 1
}

$cssFiles = Get-ChildItem -Path $v2CssDir -Filter "*.css"
foreach ($css in $cssFiles) {
    Write-Host "  Found: $($css.Name)" -ForegroundColor Gray
}

# STEP 2: Copy v2 CSS files to main css folder
Write-Host ""
Write-Host "Step 2: Copying v2 CSS files to main folder..." -ForegroundColor Yellow

$mainCssDir = Join-Path $root "assets\css"
$newNames = @{
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

foreach ($css in $cssFiles) {
    $destName = $newNames[$css.Name]
    if (-not $destName) {
        $destName = $css.Name
    }
    
    $destPath = Join-Path $mainCssDir $destName
    Copy-Item $css.FullName $destPath -Force
    Write-Host "  Copied: v2/$($css.Name) -> css/$destName" -ForegroundColor Gray
}

# STEP 3: Update CSS links in HTML files
Write-Host ""
Write-Host "Step 3: Updating CSS links in HTML files..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path $root -Recurse -Include "*.html"

foreach ($htmlFile in $htmlFiles) {
    $content = Get-Content $htmlFile.FullName -Raw -Encoding UTF8
    $original = $content
    
    # Replace v2/ paths
    $content = $content -replace 'assets/css/v2/theme\.css', 'assets/css/theme-v2.css'
    $content = $content -replace 'assets/css/v2/ui\.css', 'assets/css/ui-v2.css'
    $content = $content -replace 'assets/css/v2/dashboard\.css', 'assets/css/dashboard-v2.css'
    $content = $content -replace 'assets/css/v2/profile\.css', 'assets/css/profile-v2.css'
    $content = $content -replace 'assets/css/v2/exchange\.css', 'assets/css/exchange-v2.css'
    $content = $content -replace 'assets/css/v2/orders\.css', 'assets/css/orders-v2.css'
    $content = $content -replace 'assets/css/v2/order\.css', 'assets/css/order-v2.css'
    $content = $content -replace 'assets/css/v2/deposit\.css', 'assets/css/deposit-v2.css'
    $content = $content -replace 'assets/css/v2/admin-v2\.css', 'assets/css/admin-v2.css'
    $content = $content -replace 'assets/css/v2/content\.css', 'assets/css/content-v2.css'
    $content = $content -replace 'assets/css/v2/auth\.css', 'assets/css/auth-v2.css'
    
    # Handle relative paths (../../)
    $content = $content -replace '\.\./\.\./assets/css/v2/theme\.css', '../../assets/css/theme-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/ui\.css', '../../assets/css/ui-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/dashboard\.css', '../../assets/css/dashboard-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/profile\.css', '../../assets/css/profile-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/exchange\.css', '../../assets/css/exchange-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/orders\.css', '../../assets/css/orders-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/order\.css', '../../assets/css/order-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/deposit\.css', '../../assets/css/deposit-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/admin-v2\.css', '../../assets/css/admin-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/content\.css', '../../assets/css/content-v2.css'
    $content = $content -replace '\.\./\.\./assets/css/v2/auth\.css', '../../assets/css/auth-v2.css'
    
    # Handle assets/ paths (root level)
    $content = $content -replace 'assets/css/v2/', 'assets/css/'
    
    if ($content -ne $original) {
        Set-Content -Path $htmlFile.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Updated: $($htmlFile.Name)" -ForegroundColor Gray
    }
}

# STEP 4: Verify
Write-Host ""
Write-Host "Step 4: Verifying..." -ForegroundColor Yellow

$checkFiles = @(
    "assets\css\theme-v2.css",
    "assets\css\ui-v2.css",
    "assets\css\content-v2.css",
    "assets\css\dashboard-v2.css",
    "assets\css\admin-v2.css"
)

foreach ($check in $checkFiles) {
    $path = Join-Path $root $check
    if (Test-Path $path) {
        Write-Host "  OK: $check" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $check" -ForegroundColor Red
    }
}

# DONE
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host " CSS MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
# ARYANA CURRENCY — Migration v2 to v1
# Move old files, rename v2 files, update links

$ErrorActionPreference = "Stop"
$root = "C:\Users\ShirzadPC\Desktop\ARYANA\frontend"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " ARYANA CURRENCY - Migration v2 to v1" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Remove old v1 files
Write-Host "Step 1: Removing old v1 files..." -ForegroundColor Yellow

$oldFiles = @(
    "index.html",
    "pages\login.html",
    "pages\register.html",
    "pages\dashboard.html",
    "pages\profile.html",
    "pages\exchange.html",
    "pages\orders.html",
    "pages\order.html",
    "pages\about.html",
    "pages\contact.html",
    "pages\privacy.html",
    "pages\terms.html",
    "pages\risk.html",
    "pages\404.html",
    "pages\admin\index.html",
    "pages\admin\orders.html",
    "pages\admin\order-detail.html",
    "pages\admin\kyc.html",
    "pages\admin\rates.html",
    "pages\admin\users.html"
)

foreach ($file in $oldFiles) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  Removed: $file" -ForegroundColor Gray
    }
}

# STEP 2: Rename v2 files
Write-Host ""
Write-Host "Step 2: Renaming v2 files..." -ForegroundColor Yellow

$renames = @{
    "index-v2.html" = "index.html"
    "pages\login-v2.html" = "pages\login.html"
    "pages\register-v2.html" = "pages\register.html"
    "pages\dashboard-v2.html" = "pages\dashboard.html"
    "pages\profile-v2.html" = "pages\profile.html"
    "pages\exchange-v2.html" = "pages\exchange.html"
    "pages\orders-v2.html" = "pages\orders.html"
    "pages\order-v2.html" = "pages\order.html"
    "pages\about-v2.html" = "pages\about.html"
    "pages\contact-v2.html" = "pages\contact.html"
    "pages\privacy-v2.html" = "pages\privacy.html"
    "pages\terms-v2.html" = "pages\terms.html"
    "pages\risk-v2.html" = "pages\risk.html"
    "pages\404-v2.html" = "pages\404.html"
    "pages\admin\index-v2.html" = "pages\admin\index.html"
    "pages\admin\orders-v2.html" = "pages\admin\orders.html"
    "pages\admin\order-detail-v2.html" = "pages\admin\order-detail.html"
    "pages\admin\kyc-v2.html" = "pages\admin\kyc.html"
    "pages\admin\withdrawals-v2.html" = "pages\admin\withdrawals.html"
    "pages\admin\rates-v2.html" = "pages\admin\rates.html"
    "pages\admin\users-v2.html" = "pages\admin\users.html"
}

foreach ($old in $renames.Keys) {
    $oldPath = Join-Path $root $old
    $newPath = Join-Path $root $renames[$old]
    
    if (Test-Path $oldPath) {
        Move-Item $oldPath $newPath -Force
        Write-Host "  Renamed: $old -> $($renames[$old])" -ForegroundColor Gray
    } else {
        Write-Host "  Skipped (not found): $old" -ForegroundColor DarkGray
    }
}

# STEP 3: Rename JS files
Write-Host ""
Write-Host "Step 3: Renaming JS files..." -ForegroundColor Yellow

$jsRenames = @{
    "assets\js\home-v2.js" = "assets\js\home.js"
    "assets\js\dashboard-v2.js" = "assets\js\dashboard.js"
    "assets\js\profile-v2.js" = "assets\js\profile.js"
    "assets\js\exchange-v2.js" = "assets\js\exchange.js"
    "assets\js\orders-v2.js" = "assets\js\orders.js"
    "assets\js\order-v2.js" = "assets\js\order.js"
}

foreach ($old in $jsRenames.Keys) {
    $oldPath = Join-Path $root $old
    $newPath = Join-Path $root $jsRenames[$old]
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Remove-Item $newPath -Force
        }
        Move-Item $oldPath $newPath -Force
        Write-Host "  Renamed: $old -> $($jsRenames[$old])" -ForegroundColor Gray
    }
}

# STEP 4: Update links in HTML
Write-Host ""
Write-Host "Step 4: Updating links in HTML files..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path $root -Recurse -Include "*.html"

foreach ($htmlFile in $htmlFiles) {
    $content = Get-Content $htmlFile.FullName -Raw -Encoding UTF8
    $original = $content
    
    $content = $content -replace 'index-v2\.html', 'index.html'
    $content = $content -replace 'login-v2\.html', 'login.html'
    $content = $content -replace 'register-v2\.html', 'register.html'
    $content = $content -replace 'dashboard-v2\.html', 'dashboard.html'
    $content = $content -replace 'profile-v2\.html', 'profile.html'
    $content = $content -replace 'exchange-v2\.html', 'exchange.html'
    $content = $content -replace 'orders-v2\.html', 'orders.html'
    $content = $content -replace 'order-detail-v2\.html', 'order-detail.html'
    $content = $content -replace 'order-v2\.html', 'order.html'
    $content = $content -replace 'about-v2\.html', 'about.html'
    $content = $content -replace 'contact-v2\.html', 'contact.html'
    $content = $content -replace 'privacy-v2\.html', 'privacy.html'
    $content = $content -replace 'terms-v2\.html', 'terms.html'
    $content = $content -replace 'risk-v2\.html', 'risk.html'
    $content = $content -replace '404-v2\.html', '404.html'
    $content = $content -replace 'kyc-v2\.html', 'kyc.html'
    $content = $content -replace 'withdrawals-v2\.html', 'withdrawals.html'
    $content = $content -replace 'rates-v2\.html', 'rates.html'
    $content = $content -replace 'users-v2\.html', 'users.html'
    
    $content = $content -replace 'home-v2\.js', 'home.js'
    $content = $content -replace 'dashboard-v2\.js', 'dashboard.js'
    $content = $content -replace 'profile-v2\.js', 'profile.js'
    $content = $content -replace 'exchange-v2\.js', 'exchange.js'
    $content = $content -replace 'orders-v2\.js', 'orders.js'
    $content = $content -replace 'order-v2\.js', 'order.js'
    
    if ($content -ne $original) {
        Set-Content -Path $htmlFile.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Updated: $($htmlFile.Name)" -ForegroundColor Gray
    }
}

# STEP 5: Update common.js
Write-Host ""
Write-Host "Step 5: Updating common.js..." -ForegroundColor Yellow

$commonJs = Join-Path $root "assets\js\admin-v2\common.js"
if (Test-Path $commonJs) {
    $content = Get-Content $commonJs -Raw -Encoding UTF8
    $original = $content
    
    $content = $content -replace 'index-v2\.html', 'index.html'
    $content = $content -replace 'orders-v2\.html', 'orders.html'
    $content = $content -replace 'kyc-v2\.html', 'kyc.html'
    $content = $content -replace 'withdrawals-v2\.html', 'withdrawals.html'
    $content = $content -replace 'rates-v2\.html', 'rates.html'
    $content = $content -replace 'users-v2\.html', 'users.html'
    $content = $content -replace 'dashboard-v2\.html', 'dashboard.html'
    
    if ($content -ne $original) {
        Set-Content -Path $commonJs -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Updated common.js" -ForegroundColor Gray
    }
}

# DONE
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host " MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test locally: http://127.0.0.1:5500/index.html" -ForegroundColor Gray
Write-Host "  2. git add . ; git commit ; git push" -ForegroundColor Gray
Write-Host ""
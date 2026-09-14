# Register 'Autonoma Build' function in PowerShell Profile
$ProfilePath = $PROFILE
$ProfileDir = Split-Path $ProfilePath -Parent

if (-not (Test-Path $ProfileDir)) {
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}

$FunctionCode = @"

# Autonoma Build System Custom Command
function Autonoma {
    param([string]`$SubCommand)
    & "D:\Workspace\Autonoma\Autonoma_ERP\Autonoma.ps1" `$SubCommand `$args
}
"@

if (Test-Path $ProfilePath) {
    $Content = Get-Content $ProfilePath -Raw
    if ($Content -notlike "*function Autonoma*") {
        Add-Content -Path $ProfilePath -Value $FunctionCode
    }
} else {
    Set-Content -Path $ProfilePath -Value $FunctionCode
}

# Also set in current session
function global:Autonoma {
    param([string]$SubCommand)
    & "D:\Workspace\Autonoma\Autonoma_ERP\Autonoma.ps1" $SubCommand $args
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "'Autonoma Build' command registered successfully!" -ForegroundColor Green
Write-Host "You can now type 'Autonoma Build' directly in PowerShell." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

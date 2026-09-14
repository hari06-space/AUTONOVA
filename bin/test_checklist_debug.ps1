$loginUrl = "http://localhost:8081/api/account/login"
$debugUrl = "http://localhost:8081/api/qms/checklist/debug-session"

$body = @{
    email = "EMP-001"
    password = "EMP-001"
    tenantId = $null
    divisionId = $null
} | ConvertTo-Json

try {
    Write-Host "Logging in as EMP-001..."
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    
    $token = $loginResponse.serviceToken
    Write-Host "JWT Token obtained successfully."
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "Calling debug-session endpoint..."
    $debugResponse = Invoke-RestMethod -Uri $debugUrl -Method Get -Headers $headers
    
    Write-Host "`n--- DEBUG SESSION RESPONSE ---"
    $debugResponse | ConvertTo-Json
    
} catch {
    Write-Host "Error occurred: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResponse = $reader.ReadToEnd()
        Write-Host "Response details: $errResponse"
    }
}

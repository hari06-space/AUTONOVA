$loginUrl = "http://localhost:8081/api/account/login"
$verifyUrl = "http://localhost:8081/api/qms/checklist/verify"

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
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $verifyPayload = @{
        assignmentId = 40008
        status = "Completed"
        verifiedBy = "EMP-001"
        remarks = "Completing task"
    } | ConvertTo-Json
    
    Write-Host "Calling verify endpoint to complete task 40008..."
    $verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Method Post -Body $verifyPayload -ContentType "application/json" -Headers $headers
    
    Write-Host "`n--- VERIFY RESPONSE ---"
    $verifyResponse | ConvertTo-Json
    
} catch {
    Write-Host "Error occurred: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResponse = $reader.ReadToEnd()
        Write-Host "Response details: $errResponse"
    }
}

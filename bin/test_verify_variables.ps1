$connString = "Server=localhost;Database=AUTONOMA;User Id=nutech;Password=nutech@2026;TrustServerCertificate=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    
    # 1. Fetch UserCredential for EMP-001
    $cmd.CommandText = "SELECT USER_ID, EMP_ID, USER_LEVEL FROM AD_USER_CREDENTIAL WHERE USER_ID = 'EMP-001'"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) > $null
    
    if ($dataset.Tables[0].Rows.Count -eq 0) {
        Write-Host "UserCredential not found for EMP-001!"
        return
    }
    
    $row = $dataset.Tables[0].Rows[0]
    $userId = $row["USER_ID"]
    $empId = $row["EMP_ID"]
    $userLevel = $row["USER_LEVEL"]
    Write-Host "User ID: $userId"
    Write-Host "EMP_ID in UserCredential: $empId"
    Write-Host "User Level: $userLevel"
    
    if ($empId -eq [System.DBNull]::Value) {
        Write-Host "EMP_ID is NULL in UserCredential!"
        return
    }
    
    # 2. Fetch EmployeeMaster for this EMP_ID
    $cmd.CommandText = "SELECT ID, EMP_CODE, EMPLOYEE_NAME, FIRST_NAME, LAST_NAME FROM HR_EMPLOYEE WHERE ID = $empId"
    $dataset2 = New-Object System.Data.DataSet
    $adapter.Fill($dataset2) > $null
    
    if ($dataset2.Tables[0].Rows.Count -eq 0) {
        Write-Host "EmployeeMaster not found for ID $empId!"
        return
    }
    
    $empRow = $dataset2.Tables[0].Rows[0]
    $verifierEmpCode = $empRow["EMP_CODE"]
    $verifierEmpName = $empRow["EMPLOYEE_NAME"]
    $firstName = $empRow["FIRST_NAME"]
    $lastName = $empRow["LAST_NAME"]
    Write-Host "Verifier Emp Code: $verifierEmpCode"
    Write-Host "Verifier Emp Name: $verifierEmpName"
    Write-Host "First Name: $firstName, Last Name: $lastName"
    
    # 3. Fetch assignments
    $cmd.CommandText = "SELECT ID, CHECKLIST_ID, ASSIGNED_TO, STATUS_ID FROM QMS_CHECKLIST_ASSIGNMENT WHERE ID IN (60021, 60025, 40008, 40009)"
    $dataset3 = New-Object System.Data.DataSet
    $adapter.Fill($dataset3) > $null
    
    Write-Host "`n--- ASSIGNMENT MATCHING ---"
    foreach ($assignRow in $dataset3.Tables[0].Rows) {
        $assignId = $assignRow["ID"]
        $assignedTo = $assignRow["ASSIGNED_TO"]
        $statusId = $assignRow["STATUS_ID"]
        
        $isMatchCode = ($verifierEmpCode -ne $null -and $verifierEmpCode.ToString().ToLower() -eq $assignedTo.ToString().ToLower())
        $isMatchName = ($verifierEmpName -ne $null -and $verifierEmpName.ToString().ToLower() -eq $assignedTo.ToString().ToLower())
        
        $isMatch = ($isMatchCode -or $isMatchName)
        
        Write-Host "Assignment ID: $assignId"
        Write-Host "  Assigned To: '$assignedTo'"
        Write-Host "  Status ID: $statusId"
        Write-Host "  Match Code: $isMatchCode"
        Write-Host "  Match Name: $isMatchName"
        Write-Host "  Is Match: $isMatch"
    }
    
} catch {
    Write-Host "Error: $_"
} finally {
    $conn.Close()
}

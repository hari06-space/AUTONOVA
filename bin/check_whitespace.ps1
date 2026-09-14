$connString = "Server=localhost;Database=AUTONOMA;User Id=nutech;Password=nutech@2026;TrustServerCertificate=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    
    Write-Host "--- Checking QMS_CHECKLIST_ASSIGNMENT.ASSIGNED_TO ---"
    $cmd.CommandText = "SELECT DISTINCT ASSIGNED_TO, LEN(ASSIGNED_TO) as LenWithoutSpaces, DATALENGTH(ASSIGNED_TO) as DataLength FROM QMS_CHECKLIST_ASSIGNMENT"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) > $null
    $dataset.Tables[0] | Format-Table -AutoSize

    Write-Host "`n--- Checking HR_EMPLOYEE ---"
    $cmd.CommandText = "SELECT ID, EMP_CODE, LEN(EMP_CODE) as LenCode, DATALENGTH(EMP_CODE) as DataLengthCode, EMPLOYEE_NAME, LEN(EMPLOYEE_NAME) as LenName, DATALENGTH(EMPLOYEE_NAME) as DataLengthName FROM HR_EMPLOYEE WHERE ID IN (1, 2)"
    $dataset2 = New-Object System.Data.DataSet
    $adapter.Fill($dataset2) > $null
    $dataset2.Tables[0] | Format-Table -AutoSize
} catch {
    Write-Host "Error: $_"
} finally {
    $conn.Close()
}

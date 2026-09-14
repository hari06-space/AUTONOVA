$connString = "Server=localhost;Database=AUTONOMA;User Id=nutech;Password=nutech@2026;TrustServerCertificate=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH 
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    (TABLE_NAME = 'QMS_CHECKLIST_ASSIGNMENT' AND COLUMN_NAME = 'ASSIGNED_TO')
    OR (TABLE_NAME = 'HR_EMPLOYEE' AND COLUMN_NAME IN ('EMP_CODE', 'EMPLOYEE_NAME'))
"@
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) > $null
    $dataset.Tables[0] | Format-Table -AutoSize
} catch {
    Write-Host "Error: $_"
} finally {
    $conn.Close()
}

$connString = "Server=localhost;Database=ERPDb_NUTECH;User Id=nutech;Password=nutech@2026;TrustServerCertificate=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) > $null
    Write-Host "--- ERPDb_NUTECH TABLES ---"
    $dataset.Tables[0] | Format-Table -AutoSize
} catch {
    Write-Host "Error: $_"
} finally {
    $conn.Close()
}

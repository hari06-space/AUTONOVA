$connString = "Server=localhost;Database=AUTONOMA;User Id=nutech;Password=nutech@2026;TrustServerCertificate=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT USER_ID, PASSWORD FROM AD_USER_CREDENTIAL"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) > $null
    
    $keyBytes = [System.Text.Encoding]::UTF8.GetBytes("AutonomaERP@2026")
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Key = $keyBytes
    $aes.Mode = [System.Security.Cryptography.CipherMode]::ECB
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    
    Write-Host "--- DECRYPTED CREDENTIALS ---"
    Write-Host "USER_ID`tPASSWORD"
    Write-Host "-------`t--------"
    
    foreach ($row in $dataset.Tables[0].Rows) {
        $userId = $row["USER_ID"]
        $encPassword = $row["PASSWORD"]
        $decPassword = ""
        try {
            $cipherBytes = [System.Convert]::FromBase64String($encPassword)
            $decryptor = $aes.CreateDecryptor()
            $plainBytes = $decryptor.TransformFinalBlock($cipherBytes, 0, $cipherBytes.Length)
            $decPassword = [System.Text.Encoding]::UTF8.GetString($plainBytes)
        } catch {
            $decPassword = "[Could not decrypt: $_]"
        }
        Write-Host "$userId`t$decPassword"
    }
} catch {
    Write-Host "Error: $_"
} finally {
    $conn.Close()
}

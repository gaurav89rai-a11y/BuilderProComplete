$sqlPath = "e:\BuilderProComplete\scripts\database\BuilderPro_SSRS_Reports.sql"
$sqlContent = Get-Content -Path $sqlPath -Raw

$connectionString = "Server=localhost\SQLEXPRESS;Database=BuilderProDB;Integrated Security=True;TrustServerCertificate=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

$batches = $sqlContent -split "(?m)^\s*GO\s*$"

$count = 0
foreach ($batch in $batches) {
    $trimmed = $batch.Trim()
    if ($trimmed.Length -gt 0) {
        $cmd = $connection.CreateCommand()
        $cmd.CommandText = $trimmed
        $cmd.CommandTimeout = 60
        try {
            $cmd.ExecuteNonQuery() | Out-Null
            $count++
        } catch {
            Write-Error "Error executing batch: $_"
        }
    }
}

$connection.Close()
Write-Host "SSRS database procedures deployed successfully! Total batches: $count"

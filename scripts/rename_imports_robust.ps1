
Get-ChildItem -Path "c:\Users\gabri\Downloads\biblialm\app", "c:\Users\gabri\Downloads\biblialm\components", "c:\Users\gabri\Downloads\biblialm\views" -Include "*.tsx", "*.ts" -Recurse | ForEach-Object {
    $fullName = $_.FullName
    try {
        $content = [System.IO.File]::ReadAllText($fullName)
        $newContent = $content.Replace("/pages/", "/views/")
        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($fullName, $newContent)
            Write-Host "Updated $fullName"
        }
    } catch {
        Write-Warning "Failed to process ${fullName}: $($_.Exception.Message)"
    }
}

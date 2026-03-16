
Get-ChildItem -Path "c:\Users\gabri\Downloads\biblialm\app", "c:\Users\gabri\Downloads\biblialm\components", "c:\Users\gabri\Downloads\biblialm\views" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '/pages/', '/views/'
    if ($content -ne $newContent) {
        Set-Content $_.FullName $newContent
        Write-Host "Updated $($_.FullName)"
    }
}
Get-ChildItem -Path "c:\Users\gabri\Downloads\biblialm\app", "c:\Users\gabri\Downloads\biblialm\components", "c:\Users\gabri\Downloads\biblialm\views" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '/pages/', '/views/'
    if ($content -ne $newContent) {
        Set-Content $_.FullName $newContent
        Write-Host "Updated $($_.FullName)"
    }
}

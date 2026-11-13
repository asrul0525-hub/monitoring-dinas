$ErrorActionPreference = 'Stop'

$taskName = 'RADAR-HSU-Scheduler'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $scriptDir 'run-scheduler-hidden.vbs'

if (-not (Test-Path $vbsPath)) {
    throw "File tidak ditemukan: $vbsPath"
}

$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbsPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Menjalankan penjadwalan otomatis RADAR HSU (php artisan schedule:run) setiap 1 menit secara tersembunyi.' `
    -Force | Out-Null

Start-ScheduledTask -TaskName $taskName

Write-Host "Task Scheduler '$taskName' berhasil didaftarkan dan dijalankan."
Get-ScheduledTask -TaskName $taskName | Format-Table TaskName, State

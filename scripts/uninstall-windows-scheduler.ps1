$taskName = 'RADAR-HSU-Scheduler'
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Task Scheduler '$taskName' berhasil dihapus."
} else {
    Write-Host "Task Scheduler '$taskName' tidak terdaftar."
}

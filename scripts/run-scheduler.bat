@echo off
setlocal
set "APP_DIR=%~dp0.."
cd /d "%APP_DIR%"

set "PHP_EXE=C:\laragon\bin\php\php-8.3\php.exe"
if not exist "%PHP_EXE%" set "PHP_EXE=php"

if exist "C:\laragon\bin\php\php-8.3" set "PATH=C:\laragon\bin\php\php-8.3;%PATH%"
set "PHP_INI_SCAN_DIR=%CD%\.superpowers"

"%PHP_EXE%" artisan schedule:run --no-interaction > "%CD%\storage\logs\scheduler-last.log" 2>&1

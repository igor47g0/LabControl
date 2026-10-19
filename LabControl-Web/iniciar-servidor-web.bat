@echo off
title LabControl - Servidor Web Local
echo ========================================================
echo Iniciando Servidor Web do LabControl na porta 8000...
echo ========================================================
set "JAVA_BIN=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.3.5\jbr\bin"

start "" http://localhost:8000/
if exist "%JAVA_BIN%\jwebserver.exe" (
    "%JAVA_BIN%\jwebserver.exe" -p 8000 -d "%~dp0"
) else (
    echo Java jwebserver nao encontrado no caminho padrao.
    start "" "%~dp0index.html"
)
pause

@echo off
title Participant Registration Web Server
echo Starting Participant Registration Web Server...

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node server.js
) else (
    if exist "C:\Program Files\Adobe\Adobe Photoshop 2021\node.exe" (
        "C:\Program Files\Adobe\Adobe Photoshop 2021\node.exe" server.js
    ) else (
        echo Error: Node.js is not found on this system.
        pause
    )
)

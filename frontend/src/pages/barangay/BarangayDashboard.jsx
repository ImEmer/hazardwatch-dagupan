cmd /c "cd /d c:\Users\Emerson\hazardwatch-dagupan\frontend && npm run build"
cmd /c "cd /d c:\Users\Emerson\hazardwatch-dagupan\frontend && npm run build && cd /d c:\Users\Emerson\hazardwatch-dagupan\backend && node --check server.js"
cd "c:\Users\Emerson\hazardwatch-dagupan\frontend"; npm run build
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Set-Location 'C:\Users\Emerson\hazardwatch-dagupan\frontend'; npm run build *> build-check.log 2>&1; $frontendExit = $LASTEXITCODE; Write-Output \"FRONTEND_EXIT:$frontendExit\"; Get-Content build-check.log -Tail 40; if ($frontendExit -ne 0) { exit $frontendExit }; Set-Location 'C:\Users\Emerson\hazardwatch-dagupan\backend'; node --check server.js *> backend-check.log 2>&1; $backendExit = $LASTEXITCODE; Write-Output \"BACKEND_EXIT:$backendExit\"; Get-Content backend-check.log -Tail 40; exit $backendExit"
cmd /C "cd /d c:\Users\Emerson\hazardwatch-dagupan\frontend && npm run build && echo BUILD_OK"
cmd /V /C "cd /d c:\Users\Emerson\hazardwatch-dagupan\frontend && npm run build > build.log 2>&1 && echo BUILD_OK && type build.log"
$path = "C:\Users\Emerson\hazardwatch-dagupan\frontend\src\pages\barangay\BarangayDashboard.jsx"
@'
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { useReports } from '../../context/ReportContext';
import { showError, showSuccess } from '../../services/alerts';

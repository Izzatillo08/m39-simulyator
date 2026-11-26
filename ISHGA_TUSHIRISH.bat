@echo off
rem M-39 simulyatori: lokal serverni ishga tushiradi va brauzerni AYNAN shu papkadagi versiya bilan ochadi.
rem 8780 band bo'lsa (eski nusxa ishlayotgan bo'lsa) - keyingi bo'sh port tanlanadi.
rem Kichraytirilgan PowerShell oynasini yopmang - yopilsa, dastur to'xtaydi.
cd /d "%~dp0"
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8780 -Open

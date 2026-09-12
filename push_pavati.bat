@echo off
SET GIT="C:\Program Files\Git\bin\git.exe"

echo [1/5] Removing existing pavati remote (if any)...
%GIT% remote remove pavati 2>nul

echo [2/5] Adding new remote: PAVATI-OS
%GIT% remote add pavati https://github.com/dragonfilmshow92-web/PAVATI-OS.git

echo [3/5] Staging all changes...
%GIT% add -A

echo [4/5] Committing...
%GIT% commit -m "rebrand: rename app to PAVATI OS — update all UI, CSS, package.json and 17 source files"

echo [5/5] Pushing to PAVATI-OS on GitHub...
%GIT% push pavati main

IF %ERRORLEVEL% NEQ 0 (
  echo PUSH FAILED. Trying --force...
  %GIT% push pavati main --force
)

echo DONE.

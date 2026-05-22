@echo off
setlocal
title BibliaLM - Assistente de Deploy
set VERSION=1.9.2
set SCRIPT_DIR=%~dp0
set "HOSTING_URL=https://biblialm-ab748.web.app"
pushd "%SCRIPT_DIR%" >nul

call :INIT_TOOLS
if %errorlevel% neq 0 goto EXIT

:MENU
cls
echo ============================================================
echo                ASSISTENTE DE DEPLOY - BIBLIALM v%VERSION%
echo ============================================================
echo.
echo 1. Ambiente de Desenvolvimento (Next.js - Porta 3010 ou proxima livre)
echo 2. Gerar Build e Rodar Localmente (Porta 3010 ou proxima livre)
echo 3. Fazer Deploy para Firebase e Abrir App Publicado
echo 4. Validar TypeScript
echo 5. Popular Banco Supabase (Seed)
echo 6. LIMPEZA PROFUNDA E REINSTALACAO (Fix Canvas/SSR/Cache)
echo 7. Sair
echo.
echo ============================================================
set /p opt="Escolha uma opcao (1-7): "

if "%opt%"=="1" goto DEV
if "%opt%"=="2" goto PROD
if "%opt%"=="3" goto FIREBASE
if "%opt%"=="4" goto TYPECHECK
if "%opt%"=="5" goto SEED
if "%opt%"=="6" goto CLEAN
if "%opt%"=="7" goto EXIT
goto MENU

:DEV
echo.
echo [INFO] Iniciando servidor de desenvolvimento...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call :CHECK_DEV_LOCK
if %errorlevel% equ 0 (
    echo.
    echo [INFO] Ja existe um servidor Next.js rodando neste projeto.
    echo [INFO] Acesse: http://localhost:%RUNNING_PORT%
    echo.
    echo [DICA] Para reiniciar do zero, feche o terminal antigo ou finalize o processo Node correspondente.
    pause
    goto MENU
)
set "DEV_PORT=3010"
call :FIND_FREE_PORT DEV_PORT
echo [INFO] Usando porta %DEV_PORT%.
echo [INFO] Abrindo servidor em uma janela propria para manter o processo ativo.
set "NEXT_CMD=%SCRIPT_DIR%node_modules\.bin\next.cmd"
start "BibliaLM Dev Server" /D "%SCRIPT_DIR%" cmd /k ""%NEXT_CMD%" dev -p %DEV_PORT% --webpack"
call :WAIT_FOR_APP %DEV_PORT%
if %errorlevel% equ 0 (
    echo.
    echo [SUCESSO] Servidor de desenvolvimento ativo.
    echo [INFO] Acesse: http://localhost:%DEV_PORT%
    start "" "http://localhost:%DEV_PORT%"
) else (
    echo.
    echo [AVISO] A porta abriu, mas a pagina inicial ainda nao respondeu completa.
    echo [INFO] Acesse manualmente quando a janela "BibliaLM Dev Server" terminar de compilar:
    echo [INFO] http://localhost:%DEV_PORT%
)
pause
goto MENU

:PROD
echo.
echo [INFO] Gerando build de producao...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call "%NPM_CMD%" run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build!
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando servidor de producao...
set "PROD_PORT=3010"
call :FIND_FREE_PORT PROD_PORT
echo [INFO] Usando porta %PROD_PORT%.
call "%NPM_CMD%" run start -- -p %PROD_PORT%
pause
goto MENU

:FIREBASE
echo.
echo [INFO] Gerando build antes do deploy...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call "%NPM_CMD%" run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build! Nao sera feito o deploy.
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando deploy para o Firebase...
call :FIREBASE_DEPLOY
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no deploy do Firebase! Verifique se voce esta logado com firebase login.
    pause
    goto MENU
)
echo.
echo [SUCESSO] Deploy concluido com sucesso!
echo [INFO] App publicado em: %HOSTING_URL%
echo [INFO] Abrindo app publicado no navegador...
start "" "%HOSTING_URL%"
echo.
echo [AVISO] Esta opcao nao inicia servidor local. Para rodar localmente, use a opcao 1.
pause
goto MENU

:TYPECHECK
echo.
echo [INFO] Validando TypeScript...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call "%NPM_CMD%" run typecheck
pause
goto MENU

:SEED
echo.
echo [INFO] Iniciando seed do Supabase...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call node scripts/seed_supabase.js
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao popular o Supabase!
    pause
    goto MENU
)
echo.
echo [SUCESSO] Seed concluido com sucesso!
pause
goto MENU

:CLEAN
echo.
echo [ATENCAO] Iniciando limpeza profunda...
echo [1/4] Removendo cache do Next.js (.next)...
if exist .next rmdir /s /q .next
echo [2/4] Removendo modulos antigos (node_modules)...
if exist node_modules rmdir /s /q node_modules
echo [3/4] Reinstalando dependencias...
call "%NPM_CMD%" ci --legacy-peer-deps
if %errorlevel% neq 0 call "%NPM_CMD%" install
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao reinstalar dependencias!
    pause
    goto MENU
)
echo [4/4] Limpando cache do npm...
call "%NPM_CMD%" cache clean --force
echo.
echo [SUCESSO] Limpeza e reinstalacao concluidas!
echo Agora voce pode rodar o ambiente de desenvolvimento (Opcao 1).
pause
goto MENU

:CHECK_DEPS
if exist node_modules\.bin\next.cmd exit /b 0
echo.
echo [INFO] Dependencias nao encontradas. Instalando com npm ci...
call "%NPM_CMD%" ci --legacy-peer-deps
if %errorlevel% equ 0 exit /b 0
echo.
echo [AVISO] npm ci falhou. Tentando npm install...
call "%NPM_CMD%" install
if %errorlevel% neq 0 exit /b 1
exit /b 0

:CHECK_DEV_LOCK
set "RUNNING_PORT="
if not exist .next\dev\lock exit /b 1
for /f "delims=" %%P in ('powershell -NoProfile -Command "$ports = 3010..3020 | Where-Object { Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue }; if ($ports) { $ports[0] }" 2^>nul') do (
    set "RUNNING_PORT=%%P"
    goto DEV_LOCK_FOUND
)
echo [AVISO] Encontrei um lock antigo do Next.js sem servidor ativo. Removendo lock obsoleto...
del /q .next\dev\lock >nul 2>nul
exit /b 1

:DEV_LOCK_FOUND
exit /b 0

:FIND_FREE_PORT
setlocal enabledelayedexpansion
set "PORT_VALUE=!%~1!"
:PORT_LOOP
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort !PORT_VALUE! -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if !errorlevel! equ 0 (
    echo [AVISO] Porta !PORT_VALUE! em uso. Tentando proxima porta...
    set /a PORT_VALUE+=1
    goto PORT_LOOP
)
endlocal & set "%~1=%PORT_VALUE%"
exit /b 0

:WAIT_FOR_APP
set "PORT_TO_WAIT=%~1"
powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(60); $url = 'http://127.0.0.1:%PORT_TO_WAIT%/'; do { Start-Sleep -Milliseconds 750; $listener = Get-NetTCPConnection -LocalPort %PORT_TO_WAIT% -State Listen -ErrorAction SilentlyContinue; if (-not $listener) { continue }; try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10; if ($response.StatusCode -eq 200 -and $response.Content.Length -gt 5000 -and $response.Content.Contains('__next')) { exit 0 } } catch {} } while ((Get-Date) -lt $deadline); exit 1" >nul 2>nul
exit /b %errorlevel%

:INIT_TOOLS
set NPM_CMD=
set NPX_CMD=

if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
    set "NPX_CMD=%ProgramFiles%\nodejs\npx.cmd"
    exit /b 0
)

if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
    set "NPX_CMD=%ProgramFiles(x86)%\nodejs\npx.cmd"
    exit /b 0
)

for /f "delims=" %%I in ('where npm.cmd 2^>nul') do (
    set "NPM_CMD=%%I"
    goto NPM_FOUND
)
goto NPM_NOT_FOUND

:NPM_FOUND
for /f "delims=" %%I in ('where npx.cmd 2^>nul') do (
    set "NPX_CMD=%%I"
    goto NPX_FOUND
)
set "NPX_CMD=npx.cmd"

:NPX_FOUND
if defined NPM_CMD (
    exit /b 0
)

:NPM_NOT_FOUND
echo.
echo [ERRO] Nao encontrei o Node.js/npm neste computador.
echo.
echo Instale o Node.js 20 LTS e abra este arquivo novamente:
echo https://nodejs.org/
echo.
echo Se o Node.js ja estiver instalado, feche e reabra o terminal
echo ou adicione a pasta do Node.js ao PATH do Windows.
echo.
pause
exit /b 1

:FIREBASE_DEPLOY
where firebase.cmd >nul 2>nul
if %errorlevel% equ 0 (
    call firebase deploy
    exit /b
)

echo [INFO] Firebase CLI global nao encontrado. Usando npx firebase-tools...
call "%NPX_CMD%" --yes firebase-tools deploy
exit /b %errorlevel%

:DEPS_ERROR
echo.
echo [ERRO] Falha ao instalar dependencias!
pause
goto MENU

:EXIT
echo Finalizando...
popd >nul
endlocal
exit

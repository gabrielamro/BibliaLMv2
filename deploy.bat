@echo off
setlocal
title BibliaLM - Assistente de Deploy
set VERSION=1.9.2

:MENU
cls
echo ============================================================
echo                ASSISTENTE DE DEPLOY - BIBLIALM v%VERSION%
echo ============================================================
echo.
echo 1. Ambiente de Desenvolvimento (Next.js - Porta 3010)
echo 2. Gerar Build e Rodar Localmente (Porta 3010)
echo 3. Fazer Deploy para Firebase (Build + Firebase Deploy)
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
call npm run dev
pause
goto MENU

:PROD
echo.
echo [INFO] Gerando build de producao...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build!
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando servidor de producao...
call npm run start
pause
goto MENU

:FIREBASE
echo.
echo [INFO] Gerando build antes do deploy...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build! Nao sera feito o deploy.
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando deploy para o Firebase...
call firebase deploy
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no deploy do Firebase! Verifique se voce esta logado com firebase login.
    pause
    goto MENU
)
echo.
echo [SUCESSO] Deploy concluido com sucesso!
pause
goto MENU

:TYPECHECK
echo.
echo [INFO] Validando TypeScript...
call :CHECK_DEPS
if %errorlevel% neq 0 goto DEPS_ERROR
call npm run typecheck
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
call npm ci --legacy-peer-deps
if %errorlevel% neq 0 call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao reinstalar dependencias!
    pause
    goto MENU
)
echo [4/4] Limpando cache do npm...
call npm cache clean --force
echo.
echo [SUCESSO] Limpeza e reinstalacao concluidas!
echo Agora voce pode rodar o ambiente de desenvolvimento (Opcao 1).
pause
goto MENU

:CHECK_DEPS
if exist node_modules\.bin\next.cmd exit /b 0
echo.
echo [INFO] Dependencias nao encontradas. Instalando com npm ci...
call npm ci --legacy-peer-deps
if %errorlevel% equ 0 exit /b 0
echo.
echo [AVISO] npm ci falhou. Tentando npm install...
call npm install
if %errorlevel% neq 0 exit /b 1
exit /b 0

:DEPS_ERROR
echo.
echo [ERRO] Falha ao instalar dependencias!
pause
goto MENU

:EXIT
echo Finalizando...
endlocal
exit

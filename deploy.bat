@echo off
setlocal
title BíbliaLM - Assistente de Deploy

:MENU
cls
echo ============================================================
echo                ASSISTENTE DE DEPLOY - BIBLIALM
echo ============================================================
echo.
echo 1. Rodar Ambiente de Desenvolvimento (Next.js - Porta 3010)
echo 2. Gerar Build e Rodar Localmente (Producao - Porta 3010)
echo 3. Fazer Deploy para Firebase (Build + Firebase Deploy)
echo 4. Rodar Testes (Lint)
echo 5. Popular Banco Supabase (Seed - scripts/seed_supabase.js)
echo 6. Sair
echo.
echo ============================================================
set /p opt="Escolha uma opcao (1-6): "

if "%opt%"=="1" goto DEV
if "%opt%"=="2" goto PROD
if "%opt%"=="3" goto FIREBASE
if "%opt%"=="4" goto LINT
if "%opt%"=="5" goto SEED
if "%opt%"=="6" goto EXIT
goto MENU

:DEV
echo.
echo [INFO] Iniciando servidor de desenvolvimento...
npm run dev
pause
goto MENU

:PROD
echo.
echo [INFO] Gerando build de producao...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build!
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando servidor de producao...
npm run start
pause
goto MENU

:FIREBASE
echo.
echo [INFO] Gerando build antes do deploy...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na geracao da build! Nao sera feito o deploy.
    pause
    goto MENU
)
echo.
echo [INFO] Iniciando deploy para o Firebase...
firebase deploy
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no deploy do Firebase! Verifique se voce esta logado (firebase login).
    pause
    goto MENU
)
echo.
echo [SUCESSO] Deploy concluido com sucesso!
pause
goto MENU

:LINT
echo.
echo [INFO] Rodando Lint...
npm run lint
pause
goto MENU

:SEED
echo.
echo [INFO] Iniciando seed do Supabase...
node scripts/seed_supabase.js
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao popular o Supabase!
    pause
    goto MENU
)
echo.
echo [SUCESSO] Seed concluído com sucesso!
pause
goto MENU

:EXIT
echo Finalizando...
endlocal
exit

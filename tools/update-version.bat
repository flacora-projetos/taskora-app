@echo off
setlocal enabledelayedexpansion

REM Script para atualizar automaticamente o arquivo principal do Taskora
REM Uso: update-version.bat taskora_v5.6.0_nova_feature.html

if "%~1"=="" (
    echo Erro: Especifique o nome do novo arquivo de versao.
    echo Uso: update-version.bat taskora_v5.6.0_nova_feature.html
    exit /b 1
)

set NEW_VERSION_FILE=%~1
set INDEX_PATH=..\index.html
set NEW_VERSION_PATH=..\%NEW_VERSION_FILE%

REM Verificar se o arquivo index.html existe
if not exist "%INDEX_PATH%" (
    echo Erro: Arquivo index.html nao encontrado em: %INDEX_PATH%
    exit /b 1
)

REM Verificar se o novo arquivo de versão existe
if not exist "%NEW_VERSION_PATH%" (
    echo Erro: Novo arquivo de versao nao encontrado: %NEW_VERSION_PATH%
    exit /b 1
)

REM Criar arquivo temporário
set TEMP_FILE=%TEMP%\taskora_index_temp.html

REM Processar o arquivo index.html
set FOUND=0

for /f "tokens=*" %%a in ('type "%INDEX_PATH%"') do (
    set LINE=%%a
    if "!LINE:const CURRENT_VERSION_FILE=!" neq "!LINE!" (
        echo     const CURRENT_VERSION_FILE = './%NEW_VERSION_FILE%';>> "%TEMP_FILE%"
        set FOUND=1
    ) else (
        echo !LINE!>> "%TEMP_FILE%"
    )
)

if %FOUND% equ 0 (
    echo Erro: Nao foi possivel encontrar a linha 'const CURRENT_VERSION_FILE' no arquivo index.html
    del "%TEMP_FILE%"
    exit /b 1
)

REM Substituir o arquivo original pelo temporário
copy /y "%TEMP_FILE%" "%INDEX_PATH%" > nul
del "%TEMP_FILE%"

echo ✓ Arquivo index.html atualizado com sucesso para apontar para: %NEW_VERSION_FILE%

REM Atualizar também o READMEFIRST.md
set README_PATH=..\docs\READMEFIRST.md

if exist "%README_PATH%" (
    set TEMP_README=%TEMP%\taskora_readme_temp.md
    set APP_VERSION_FOUND=0
    set MAIN_FILE_FOUND=0
    
    for /f "tokens=*" %%a in ('type "%README_PATH%"') do (
        set LINE=%%a
        
        if "!LINE:App Version: =!" neq "!LINE!" (
            echo App Version: %NEW_VERSION_FILE%>> "%TEMP_README%"
            set APP_VERSION_FOUND=1
        ) else if "!LINE:Main File: =!" neq "!LINE!" (
            echo Main File: %NEW_VERSION_FILE%>> "%TEMP_README%"
            set MAIN_FILE_FOUND=1
        ) else (
            echo !LINE!>> "%TEMP_README%"
        )
    )
    
    copy /y "%TEMP_README%" "%README_PATH%" > nul
    del "%TEMP_README%"
    
    echo ✓ Arquivo READMEFIRST.md atualizado com sucesso para refletir a nova versao: %NEW_VERSION_FILE%
)

echo.
echo 🚀 Pronto! O Taskora agora esta configurado para usar a versao: %NEW_VERSION_FILE%
echo Voce pode fazer commit das alteracoes e enviar para o repositorio.
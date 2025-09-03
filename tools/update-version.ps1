# Script para atualizar automaticamente o arquivo principal do Taskora
# Uso: ./update-version.ps1 -NewVersionFile "taskora_v5.6.0_nova_feature.html"

param (
    [Parameter(Mandatory=$true)]
    [string]$NewVersionFile
)

# Caminho para o arquivo index.html
$indexPath = "$PSScriptRoot\..\index.html"

# Verificar se o arquivo index.html existe
if (-not (Test-Path $indexPath)) {
    Write-Error "Arquivo index.html não encontrado em: $indexPath"
    exit 1
}

# Verificar se o novo arquivo de versão existe
$newVersionPath = "$PSScriptRoot\..\$NewVersionFile"
if (-not (Test-Path $newVersionPath)) {
    Write-Error "Novo arquivo de versão não encontrado: $newVersionPath"
    exit 1
}

# Ler o conteúdo do arquivo index.html
$content = Get-Content -Path $indexPath -Raw

# Padrão para encontrar a linha da constante CURRENT_VERSION_FILE
$pattern = "const CURRENT_VERSION_FILE = '.+?';"

# Nova linha com o novo arquivo de versão
$replacement = "const CURRENT_VERSION_FILE = './$NewVersionFile';"

# Substituir a linha no conteúdo
if ($content -match $pattern) {
    $updatedContent = $content -replace $pattern, $replacement
    
    # Escrever o conteúdo atualizado de volta para o arquivo
    $updatedContent | Set-Content -Path $indexPath -NoNewline
    
    Write-Host "✅ Arquivo index.html atualizado com sucesso para apontar para: $NewVersionFile"
} else {
    Write-Error "Não foi possível encontrar a linha 'const CURRENT_VERSION_FILE' no arquivo index.html"
    exit 1
}

# Atualizar também o READMEFIRST.md para refletir a nova versão
$readmeFirstPath = "$PSScriptRoot\..\docs\READMEFIRST.md"
if (Test-Path $readmeFirstPath) {
    $readmeContent = Get-Content -Path $readmeFirstPath -Raw
    
    # Padrão para encontrar a linha com a versão atual do app
    $appVersionPattern = "App Version: .+?"
    $appVersionReplacement = "App Version: $NewVersionFile"
    
    # Padrão para encontrar a linha com o arquivo principal
    $mainFilePattern = "Main File: .+?"
    $mainFileReplacement = "Main File: $NewVersionFile"
    
    # Substituir as linhas no conteúdo
    $updatedReadmeContent = $readmeContent -replace $appVersionPattern, $appVersionReplacement
    $updatedReadmeContent = $updatedReadmeContent -replace $mainFilePattern, $mainFileReplacement
    
    # Escrever o conteúdo atualizado de volta para o arquivo
    $updatedReadmeContent | Set-Content -Path $readmeFirstPath -NoNewline
    
    Write-Host "✅ Arquivo READMEFIRST.md atualizado com sucesso para refletir a nova versão: $NewVersionFile"
}

Write-Host "\n🚀 Pronto! O Taskora agora está configurado para usar a versão: $NewVersionFile"
Write-Host "Você pode fazer commit das alterações e enviar para o repositório."
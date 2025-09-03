# Atualização Automática de Versão do Taskora

## 🚀 Visão Geral

Para facilitar o processo de atualização da versão principal do Taskora, criamos scripts de automação que atualizam automaticamente o arquivo `index.html` e outros arquivos de documentação relevantes, sem a necessidade de edição manual.

## 📋 Scripts Disponíveis

Existem duas opções de scripts, dependendo da sua preferência:

1. **PowerShell** (recomendado): `tools/update-version.ps1`
2. **Batch** (CMD): `tools/update-version.bat`

## 🔧 Como Usar

### Usando PowerShell (Recomendado)

```powershell
# Navegue até a pasta tools
cd tools

# Execute o script informando o nome do novo arquivo principal
.\update-version.ps1 -NewVersionFile "taskora_v5.6.0_nova_feature.html"
```

### Usando Batch (CMD)

```batch
# Navegue até a pasta tools
cd tools

# Execute o script informando o nome do novo arquivo principal
update-version.bat taskora_v5.6.0_nova_feature.html
```

## ✅ O Que os Scripts Fazem

Quando executados, os scripts:

1. Verificam se o novo arquivo de versão existe
2. Atualizam o `index.html` para apontar para o novo arquivo principal
3. Atualizam o `docs/READMEFIRST.md` para refletir a nova versão
4. Exibem mensagens de confirmação para cada etapa concluída

## 🔄 Fluxo de Trabalho Recomendado

1. Desenvolva a nova versão do Taskora em um novo arquivo HTML (ex: `taskora_v5.6.0_nova_feature.html`)
2. Teste a nova versão localmente
3. Execute o script de atualização automática
4. Verifique se o redirecionamento está funcionando corretamente
5. Faça commit e push das alterações
6. O Vercel fará o deploy automaticamente e o link permanecerá o mesmo

## 📝 Exemplo Completo

```powershell
# 1. Crie o novo arquivo HTML principal com as novas funcionalidades
# (Você já deve ter feito isso manualmente)

# 2. Navegue até a pasta tools
cd tools

# 3. Execute o script de atualização
.\update-version.ps1 -NewVersionFile "taskora_v5.6.0_nova_feature.html"

# 4. Verifique se tudo está funcionando corretamente
# (Abra o index.html no navegador)

# 5. Faça commit e push das alterações
git add ..
git commit -m "Atualização para versão 5.6.0 com novas funcionalidades"
git push
```

## ⚠️ Solução de Problemas

### Erro: "Arquivo não encontrado"

Verifique se:
- Você está executando o script da pasta `tools`
- O novo arquivo de versão já existe na pasta raiz do projeto
- Os caminhos relativos estão corretos

### Erro: "Não foi possível encontrar a linha 'const CURRENT_VERSION_FILE'"

Verifique se:
- O arquivo `index.html` não foi modificado manualmente de forma incorreta
- A estrutura do arquivo `index.html` segue o padrão esperado

---

*Última atualização: Maio 2024*
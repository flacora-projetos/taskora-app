# Guia de Deploy no Vercel para Taskora

## 📌 Solução para Links Permanentes

Para evitar a necessidade de compartilhar um novo link do Vercel toda vez que o nome do arquivo HTML principal é alterado, implementamos uma solução simples e eficaz:

### Como Funciona

1. O arquivo `index.html` na raiz do projeto serve como **ponto de entrada fixo** para a aplicação
2. Dentro do `index.html`, definimos uma constante `CURRENT_VERSION_FILE` que aponta para o arquivo HTML principal atual
3. O redirecionamento é feito automaticamente para o arquivo principal definido nesta constante

### Vantagens

- **URL permanente**: O link do Vercel sempre apontará para `index.html`, que por sua vez redirecionará para a versão atual
- **Fácil atualização**: Para mudar a versão, basta alterar o valor da constante `CURRENT_VERSION_FILE` no `index.html`
- **Sem quebra de links**: Links compartilhados anteriormente continuarão funcionando
- **Compatibilidade com Vercel**: Funciona perfeitamente com o sistema de deploy do Vercel

### Como Atualizar a Versão

#### Método Automático (Recomendado)

Para facilitar o processo de atualização, criamos scripts de automação que atualizam o `index.html` e outros arquivos de documentação automaticamente:

1. Crie o novo arquivo HTML principal com as novas funcionalidades
2. Execute um dos scripts de atualização:

   **PowerShell:**
   ```powershell
   cd tools
   .\update-version.ps1 -NewVersionFile "taskora_v5.6.0_nova_feature.html"
   ```

   **Batch (CMD):**
   ```batch
   cd tools
   update-version.bat taskora_v5.6.0_nova_feature.html
   ```

3. Faça commit e push das alterações
4. O Vercel fará o deploy automaticamente e o link permanecerá o mesmo

Para mais detalhes sobre os scripts de automação, consulte o arquivo `docs/ATUALIZACAO_AUTOMATICA.md`.

#### Método Manual (Alternativo)

Se preferir atualizar manualmente:

1. Crie o novo arquivo HTML principal com as novas funcionalidades
2. Abra o arquivo `index.html`
3. Altere apenas a linha que define a constante `CURRENT_VERSION_FILE`:

```javascript
// Arquivo principal atual - ALTERE APENAS ESTA LINHA ao atualizar a versão
const CURRENT_VERSION_FILE = './taskora_v5.6.0_nova_feature.html';
```

4. Faça commit e push das alterações
5. O Vercel fará o deploy automaticamente e o link permanecerá o mesmo

### Observações Importantes

- O título da página no `index.html` foi alterado para não incluir o número da versão, evitando a necessidade de atualizá-lo
- O link manual "clique aqui" também é atualizado dinamicamente para apontar para a versão atual
- Esta solução é compatível com todos os navegadores modernos

---

## 🚀 Processo de Deploy no Vercel

1. Faça login no [Vercel](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure as opções de build (se necessário)
4. Defina as variáveis de ambiente para as chaves do Firebase
5. Clique em "Deploy"

O Vercel detectará automaticamente o `index.html` como ponto de entrada e fará o deploy corretamente.
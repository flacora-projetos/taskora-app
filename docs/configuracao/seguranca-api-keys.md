# 🔒 Segurança de Chaves API - Taskora

## 📋 Resumo

Este documento estabelece as diretrizes de segurança para o gerenciamento de chaves API no projeto Taskora, garantindo que informações sensíveis não sejam expostas no repositório.

## ⚠️ Problema Identificado

Em setembro de 2025, foram identificadas **15 chaves API do Firebase expostas** em arquivos HTML do projeto, representando um grave risco de segurança. O GitHub detectou automaticamente essas exposições.

### Arquivos Afetados (Corrigidos)
- `debug-data-comparison.html`
- `tools/debug-tasks-hours.html`
- `tools/debug-team-hours.html`
- `tools/fix-data-structure.html`
- `tools/firebase-connection-test.html`
- `assets/js/config/firebase.js`
- `tools/sync-team-hours.html`
- `tools/database-schema-analyzer-fixed.html`
- `tools/validate-migrated-data.html`
- `[05-17]taskora_backup_2025-09-03.json`
- `tools/selective-field-migration.html`
- `seed/populate-team.html`
- `tools/diagnosticar-firebase-taskora.html`
- `tools/cleanup-conflicted-data.html`
- `tools/database-schema-analyzer.html`

## ✅ Solução Implementada

### 1. Remoção de Chaves Hardcoded
- Todas as chaves API foram substituídas por `"CHAVE_REMOVIDA_POR_SEGURANCA"`
- Arquivos HTML de debug foram desabilitados com mensagens de erro informativas

### 2. Sistema de Variáveis de Ambiente
- Criado `.env.example` com template de configuração
- Criado `.env` para configuração local (não commitado)
- Criado `firebase-secure.js` para configuração segura

### 3. Proteção do Repositório
- Atualizado `.gitignore` para proteger arquivos sensíveis
- Adicionadas regras específicas para arquivos de debug

## 🛠️ Como Usar as Configurações Seguras

### Para Desenvolvimento Local

1. **Configure o arquivo .env:**
   ```bash
   # Copie o template (se necessário)
   cp .env.example .env
   
   # Edite com suas chaves reais
   notepad .env
   ```

2. **Use a configuração segura:**
   ```javascript
   // Em vez de hardcoded:
   const firebaseConfig = {
       apiKey: "AIzaSy...", // ❌ NUNCA FAÇA ISSO
   };
   
   // Use a configuração segura:
   import { getFirebaseConfig } from './assets/js/config/firebase-secure.js';
   const firebaseConfig = getFirebaseConfig();
   ```

### Para Arquivos HTML

```html
<script type="module">
    import { firebaseConfig, validateFirebaseConfig } from './assets/js/config/firebase-secure.js';
    
    // Valide a configuração
    if (!validateFirebaseConfig(firebaseConfig)) {
        console.error('Configuração do Firebase inválida!');
        return;
    }
    
    // Use a configuração
    firebase.initializeApp(firebaseConfig);
</script>
```

## 📁 Estrutura de Arquivos de Configuração

```
├── .env                          # Chaves reais (NÃO commitado)
├── .env.example                  # Template de configuração
├── .gitignore                    # Proteção de arquivos sensíveis
└── assets/js/config/
    ├── firebase.js               # Configuração principal (sem chaves)
    └── firebase-secure.js        # Sistema seguro de configuração
```

## 🚫 Regras de Segurança

### ❌ NUNCA Faça
- Hardcode chaves API em arquivos de código
- Commite arquivos `.env` no Git
- Compartilhe chaves em mensagens ou documentação
- Use chaves de produção em desenvolvimento
- Deixe chaves em arquivos de backup

### ✅ SEMPRE Faça
- Use variáveis de ambiente para chaves sensíveis
- Mantenha `.env` no `.gitignore`
- Use chaves diferentes para cada ambiente
- Rotacione chaves regularmente
- Monitore o uso das APIs
- Configure restrições de domínio no Firebase

## 🔧 Configuração do Firebase Console

### Restrições de Segurança Recomendadas

1. **API Key Restrictions:**
   - Vá para Google Cloud Console
   - APIs & Services > Credentials
   - Configure restrições de HTTP referrers

2. **Firebase Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Regras específicas do Taskora
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🚨 Procedimento de Emergência

### Se Chaves Forem Expostas

1. **Ação Imediata:**
   - Desabilite a chave no Firebase Console
   - Gere uma nova chave
   - Atualize o arquivo `.env`

2. **Limpeza do Repositório:**
   ```bash
   # Remova do histórico do Git (se necessário)
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch arquivo-com-chave.html' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Verificação:**
   ```bash
   # Busque por possíveis chaves restantes
   grep -r "AIzaSy" . --exclude-dir=node_modules
   ```

## 📊 Monitoramento

### Verificações Regulares
- [ ] Revisar logs de uso da API Firebase
- [ ] Verificar alertas de segurança do GitHub
- [ ] Auditar arquivos de configuração
- [ ] Testar restrições de domínio

### Alertas Automáticos
- GitHub Security Alerts (habilitado)
- Firebase Usage Monitoring
- Logs de acesso suspeito

## 📚 Recursos Adicionais

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)
- [GitHub Security Features](https://docs.github.com/en/code-security)
- [Environment Variables Best Practices](https://12factor.net/config)

## 🔄 Histórico de Alterações

| Data | Ação | Descrição |
|------|------|----------|
| 2025-01-24 | Correção | Remoção de 15 chaves API expostas |
| 2025-01-24 | Implementação | Sistema seguro de variáveis de ambiente |
| 2025-01-24 | Documentação | Criação deste guia de segurança |

---

**⚠️ IMPORTANTE:** Este documento deve ser atualizado sempre que houver mudanças nas práticas de segurança ou na estrutura de configuração do projeto.
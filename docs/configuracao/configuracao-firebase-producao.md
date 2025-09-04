# Configuração Firebase para Produção - URGENTE

## ⚠️ ATENÇÃO: Configurações obrigatórias antes dos usuários acessarem

Este guia contém **TODAS** as configurações que você precisa fazer no Firebase Console para que o sistema funcione corretamente em produção.

---

## 🔥 1. AUTHENTICATION - Configurar Provedores

### 1.1 Ativar Email/Password
```
1. Acesse Firebase Console → Authentication → Sign-in method
2. Clique em "Email/Password"
3. Ative "Enable"
4. Salve
```

### 1.2 Configurar Google OAuth
```
1. Na mesma tela, clique em "Google"
2. Ative "Enable"
3. Adicione seu email como "Project support email"
4. Clique em "Save"
```

### 1.3 Configurar Recuperação de Senha
```
1. Ainda em Authentication → Sign-in method
2. Clique em "Email/Password"
3. Certifique-se de que "Password reset" está habilitado
4. Configure o template de email (opcional):
   - Vá em Authentication → Templates
   - Personalize "Password reset" se necessário
5. Salve as configurações
```

### 1.4 Configurar Domínios Autorizados
```
1. Vá em Authentication → Settings → Authorized domains
2. Adicione seus domínios:
   - localhost (para desenvolvimento)
   - vercel.app
   - nandacora.com.br
```

---

## 🔒 2. FIRESTORE RULES - Aplicar Regras de Segurança

### 2.1 Substituir Regras Atuais
```
1. Acesse Firestore Database → Rules
2. SUBSTITUA todo o conteúdo por:
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Funções auxiliares
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function belongsToOrg(orgId) {
      return isAuthenticated() && 
             request.auth.token.orgId == orgId;
    }
    
    function isValidUser(orgId) {
      return isAuthenticated() && 
             request.auth.token.orgId == orgId &&
             request.auth.token.role in ['admin', 'user'];
    }
    
    // Coleção de clientes
    match /clients/{clientId} {
      allow read, write: if isValidUser(resource.data.orgId);
      allow create: if isAuthenticated() && 
                       request.auth.token.orgId == request.resource.data.orgId;
    }
    
    // Coleção de tarefas
    match /tasks/{taskId} {
      allow read, write: if isValidUser(resource.data.orgId);
      allow create: if isAuthenticated() && 
                       request.auth.token.orgId == request.resource.data.orgId;
    }
    
    // Coleção de equipe
    match /team/{memberId} {
      allow read, write: if isValidUser(resource.data.orgId);
      allow create: if isAuthenticated() && 
                       request.auth.token.orgId == request.resource.data.orgId;
    }
    
    // Coleção de projetos
    match /projects/{projectId} {
      allow read, write: if isValidUser(resource.data.orgId);
      allow create: if isAuthenticated() && 
                       request.auth.token.orgId == request.resource.data.orgId;
    }
    
    // Configurações da organização
    match /settings/{orgId} {
      allow read, write: if belongsToOrg(orgId);
    }
    
    // Dados de usuários
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if isAuthenticated() && 
                     request.auth.token.orgId == resource.data.orgId &&
                     request.auth.token.role == 'admin';
    }
  }
}
```

### 2.2 Publicar Regras
```
3. Clique em "Publish"
4. Confirme a publicação
```

---

## ⚡ 3. CLOUD FUNCTIONS - Deploy Obrigatório

### 3.1 Instalar Firebase CLI (se não tiver)
```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Deploy das Functions
```bash
# No diretório raiz do projeto
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3.3 Verificar Deploy
```
1. Acesse Firebase Console → Functions
2. Verifique se aparecem:
   - setUserClaimsOnCreate
   - updateUserClaims
   - getUserInfo
   - listOrgUsers
   - backupDiario
```

### 3.4 Testar Funcionalidades de Autenticação
```
1. Teste o login com email/senha
2. Teste o login com Google OAuth
3. Teste a recuperação de senha:
   - Clique em "Esqueci minha senha"
   - Digite um email válido
   - Verifique se o email de reset é enviado
   - Teste o link de reset recebido
4. Verifique se a interface está com o design atualizado
```

---

## 🔑 4. API KEYS - Configurar Restrições

### 4.1 Restringir API Key do Browser
```
1. Acesse Google Cloud Console → APIs & Services → Credentials
2. Encontre a API key "Browser key (auto created by Firebase)"
3. Clique para editar
4. Em "Application restrictions":
   - Selecione "HTTP referrers (web sites)"
   - Adicione:
     - localhost:*
     - 127.0.0.1:*
     - *.vercel.app/*
     - nandacora.com.br/*
     - *.nandacora.com.br/*
```

### 4.2 Restringir APIs
```
5. Em "API restrictions":
   - Selecione "Restrict key"
   - Marque apenas:
     ✅ Identity Toolkit API (Firebase Authentication)
     ✅ Cloud Firestore API
     ✅ Cloud Storage for Firebase API
     ✅ Identity and Access Management (IAM) API
6. Salve
```

---

## 👥 5. CRIAR PRIMEIRO USUÁRIO ADMIN

### 5.1 Registrar Usuário
```
1. Acesse sua aplicação
2. Registre-se com seu email
3. Anote o UID do usuário (aparece no console do navegador)
```

### 5.2 Definir como Admin (Firebase Console)
```
1. Acesse Authentication → Users
2. Encontre seu usuário
3. Clique nos 3 pontos → "Set custom user claims"
4. Adicione:
{
  "orgId": "org_001",
  "role": "admin"
}
```

---

## 📊 6. CONFIGURAR MONITORAMENTO

### 6.1 Alertas de Uso
```
1. Acesse Firebase Console → Usage and billing
2. Configure alertas em:
   - 80% do limite de reads
   - 80% do limite de writes
   - 80% do limite de storage
```

### 6.2 Orçamento (Google Cloud)
```
1. Acesse Google Cloud Console → Billing → Budgets
2. Crie orçamento mensal
3. Configure alertas em 50%, 80%, 100%
```

---

## ✅ CHECKLIST FINAL - Antes de Liberar

### Obrigatório:
- [ ] Authentication Email/Password ativado
- [ ] Google OAuth configurado
- [ ] Recuperação de senha configurada
- [ ] Domínios autorizados adicionados
- [ ] Firestore Rules publicadas
- [ ] Cloud Functions deployadas
- [ ] API Keys restringidas
- [ ] Primeiro admin criado
- [ ] Teste de login com email/senha funcionando
- [ ] Teste de login com Google OAuth funcionando
- [ ] Teste de recuperação de senha funcionando
- [ ] Interface de login com design atualizado
- [ ] Teste de CRUD funcionando

### Recomendado:
- [ ] Alertas de monitoramento configurados
- [ ] Orçamento definido
- [ ] Backup automático testado

---

## 🚨 PROBLEMAS COMUNS

### "Permission denied" no Firestore
```
Causa: Regras não aplicadas ou usuário sem custom claims
Solução: Verificar regras e custom claims do usuário
```

### "Auth domain not authorized"
```
Causa: Domínio não adicionado nos domínios autorizados
Solução: Adicionar domínio em Authentication → Settings
```

### Cloud Functions não funcionam
```
Causa: Deploy não realizado ou erro no código
Solução: Verificar logs em Functions → Logs
```

### Email de recuperação de senha não chega
```
Causa: Configuração de email não realizada ou email na pasta spam
Soluções:
1. Verificar se Password reset está habilitado em Authentication
2. Verificar pasta de spam do email
3. Testar com outro provedor de email
4. Verificar logs em Authentication → Users
```

### Interface de login não carrega corretamente
```
Causa: Cache do navegador ou arquivos CSS não atualizados
Soluções:
1. Limpar cache do navegador (Ctrl+F5)
2. Verificar se auth.css está sendo carregado
3. Verificar console do navegador para erros
4. Testar em modo incógnito
```

---

## ⏰ TEMPO ESTIMADO

- **Configuração básica**: 15-20 minutos
- **Deploy Functions**: 5-10 minutos
- **Testes**: 10-15 minutos
- **Total**: ~45 minutos

---

## 📊 Status Atual

### ✅ Configurações Concluídas
- **Authentication:** Email/Password ativado
- **Firestore Rules:** Aplicadas e funcionando
- **Cloud Functions:** 4/4 deployadas com sucesso
- **API Keys:** Configuradas com restrições
- **Domínios:** Autorizados para produção
- **🔑 CORREÇÃO CRÍTICA:** Chaves de API Firebase corrigidas (14/01/2025)

### 🔄 Configurações Pendentes
- [ ] Primeiro usuário admin
- [ ] Monitoramento e alertas
- [ ] Backup automático configurado
- [ ] Deploy das correções via GitHub Desktop

### ✅ Problemas Resolvidos
- ✅ **RESOLVIDO:** Erro `auth/api-key-not-valid` - chaves placeholder substituídas
- ✅ **CORRIGIDO:** 3 arquivos atualizados com chave real do Firebase
- ✅ **IMPLEMENTADO:** Sistema de configuração segura funcionando

---

## 📞 SUPORTE

Se algo não funcionar:
1. Verifique o console do navegador (F12)
2. Verifique logs das Cloud Functions
3. Teste com usuário admin primeiro
4. Verifique se todas as configurações foram aplicadas

**IMPORTANTE**: Faça essas configurações em horário de baixo uso para evitar impacto nos usuários!
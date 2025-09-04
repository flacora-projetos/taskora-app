# Deploy das Cloud Functions - Custom Claims

> **🚀 DEPLOY:** Instruções para implementar as Cloud Functions de autenticação e custom claims.

## Visão Geral

As Cloud Functions foram implementadas para:

- ✅ **Definir custom claims automaticamente** quando um usuário se registra
- ✅ **Associar usuários à organização** (`orgId: 'dacora'`)
- ✅ **Gerenciar permissões** via custom claims
- ✅ **Criar perfis de usuário** no Firestore
- ✅ **Funções administrativas** para gerenciar usuários

---

## Funções Implementadas

### 1. `setUserClaimsOnCreate`
**Trigger:** Executada automaticamente quando um usuário é criado

**Funcionalidade:**
- Define custom claims padrão: `{ orgId: 'dacora', role: 'user' }`
- Cria documento do usuário na coleção `users`
- Configura status inicial como `active`

### 2. `updateUserClaims`
**Tipo:** Callable Function (apenas admins)

**Funcionalidade:**
- Permite admins atualizarem custom claims de outros usuários
- Atualiza tanto o Auth quanto o Firestore
- Registra quem fez a alteração

### 3. `getUserInfo`
**Tipo:** Callable Function (admin ou próprio usuário)

**Funcionalidade:**
- Retorna informações completas do usuário
- Inclui dados do Auth e Firestore
- Controle de permissões por role

### 4. `listOrgUsers`
**Tipo:** Callable Function (apenas admins)

**Funcionalidade:**
- Lista todos os usuários da organização
- Ordenado por data de criação
- Apenas dados essenciais para listagem

---

## Pré-requisitos

### 1. Firebase CLI Instalado
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Verificar instalação
firebase --version
```

### 2. Autenticação
```bash
# Fazer login no Firebase
firebase login

# Verificar projetos disponíveis
firebase projects:list

# Selecionar projeto (se necessário)
firebase use dacora---tarefas
```

### 3. Configuração do Projeto
```bash
# Navegar para o diretório do projeto
cd "C:\Users\flaco\Documents\Trabalho\APPS\TASKORA\APP ATIVO\TASKORA - GitHub"

# Verificar configuração
firebase projects:list
cat .firebaserc
```

---

## Deploy das Functions

### Passo 1: Instalar Dependências
```bash
# Navegar para o diretório functions
cd functions

# Instalar dependências
npm install

# Verificar se não há vulnerabilidades
npm audit
```

### Passo 2: Testar Localmente (Opcional)
```bash
# Iniciar emuladores
firebase emulators:start --only functions,auth,firestore

# Em outro terminal, testar as funções
# (Abrir http://localhost:4000 para UI dos emuladores)
```

### Passo 3: Deploy para Produção
```bash
# Voltar para o diretório raiz
cd ..

# Deploy apenas das functions
firebase deploy --only functions

# Ou deploy específico de uma função
firebase deploy --only functions:setUserClaimsOnCreate
```

### Passo 4: Verificar Deploy
```bash
# Listar functions deployadas
firebase functions:list

# Ver logs das functions
firebase functions:log

# Ver logs de uma função específica
firebase functions:log --only setUserClaimsOnCreate
```

---

## Configuração de Permissões

### 1. Criar Primeiro Admin

Após o deploy, você precisará criar manualmente o primeiro usuário admin:

```javascript
// Script para executar no console do Firebase ou via Node.js
const admin = require('firebase-admin');

// Inicializar (se não estiver inicializado)
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

async function createFirstAdmin() {
  try {
    // Substitua pelo email do primeiro admin
    const adminEmail = 'admin@dacora.com.br';
    
    // Buscar usuário pelo email
    const userRecord = await auth.getUserByEmail(adminEmail);
    
    // Definir como admin
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId: 'dacora',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    // Atualizar no Firestore
    await db.collection('users').doc(userRecord.uid).update({
      role: 'admin',
      updatedAt: new Date()
    });
    
    console.log(`✅ Usuário ${adminEmail} promovido a admin`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createFirstAdmin();
```

### 2. Testar Custom Claims

```javascript
// No frontend, após login
auth.currentUser.getIdTokenResult().then((idTokenResult) => {
  console.log('Custom Claims:', idTokenResult.claims);
  console.log('OrgId:', idTokenResult.claims.orgId);
  console.log('Role:', idTokenResult.claims.role);
});
```

---

## Integração com Frontend

### 1. Atualizar AuthManager

Adicione ao <mcfile name="authManager.js" path="taskora-app/assets/js/auth/authManager.js"></mcfile>:

```javascript
// Método para obter custom claims
async getCustomClaims() {
  if (!this.currentUser) return null;
  
  try {
    const idTokenResult = await this.currentUser.getIdTokenResult();
    return idTokenResult.claims;
  } catch (error) {
    console.error('Erro ao obter custom claims:', error);
    return null;
  }
}

// Método para verificar se é admin
async isAdmin() {
  const claims = await this.getCustomClaims();
  return claims?.role === 'admin';
}

// Método para obter orgId
async getOrgId() {
  const claims = await this.getCustomClaims();
  return claims?.orgId || 'dacora';
}

// Método para chamar Cloud Function
async callFunction(functionName, data = {}) {
  try {
    const functions = getFunctions();
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Erro ao chamar função ${functionName}:`, error);
    throw error;
  }
}

// Método para atualizar claims de usuário (apenas admin)
async updateUserClaims(uid, orgId, role) {
  return await this.callFunction('updateUserClaims', { uid, orgId, role });
}

// Método para listar usuários da organização (apenas admin)
async listOrgUsers() {
  return await this.callFunction('listOrgUsers');
}
```

### 2. Atualizar Imports

No <mcfile name="firebase.js" path="taskora-app/assets/js/config/firebase.js"></mcfile>, adicione:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Inicializar Functions
const functions = getFunctions(app);

// Conectar ao emulador em desenvolvimento
if (window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { functions, httpsCallable };
```

---

## Monitoramento e Logs

### 1. Configurar Alertas

**No Firebase Console:**
1. Vá em **"Functions"**
2. Clique em cada função
3. Configure alertas para:
   - Erros de execução
   - Timeouts
   - Picos de uso

### 2. Logs Importantes

```bash
# Ver logs em tempo real
firebase functions:log --only setUserClaimsOnCreate

# Filtrar por tipo de log
firebase functions:log --only setUserClaimsOnCreate | grep "ERROR"

# Ver logs no Google Cloud Console
# https://console.cloud.google.com/logs/query
```

### 3. Métricas de Monitoramento

- **Execuções por minuto**
- **Tempo de execução médio**
- **Taxa de erro**
- **Uso de memória**
- **Invocações por usuário**

---

## Troubleshooting

### Problema: Function não executa

**Verificações:**
1. ✅ Deploy foi bem-sucedido?
2. ✅ Permissões do IAM estão corretas?
3. ✅ Região está correta (`southamerica-east1`)?
4. ✅ Logs mostram algum erro?

**Solução:**
```bash
# Verificar status das functions
firebase functions:list

# Ver logs detalhados
firebase functions:log --lines 50

# Redeploy se necessário
firebase deploy --only functions --force
```

### Problema: Custom Claims não aparecem

**Verificações:**
1. ✅ Function `setUserClaimsOnCreate` foi executada?
2. ✅ Usuário fez logout/login após o registro?
3. ✅ Token foi renovado?

**Solução:**
```javascript
// Forçar renovação do token
auth.currentUser.getIdToken(true).then((token) => {
  console.log('Token renovado');
});
```

### Problema: Permissões negadas

**Verificações:**
1. ✅ Usuário tem custom claims corretos?
2. ✅ Regras do Firestore estão atualizadas?
3. ✅ OrgId está correto?

**Solução:**
```javascript
// Verificar claims atuais
auth.currentUser.getIdTokenResult().then((result) => {
  console.log('Claims atuais:', result.claims);
});
```

---

## Checklist de Deploy

- [ ] ✅ Firebase CLI instalado e configurado
- [ ] ✅ Dependências das functions instaladas
- [ ] ✅ Functions deployadas com sucesso
- [ ] ✅ Primeiro admin criado manualmente
- [ ] ✅ Custom claims testados
- [ ] ✅ Frontend integrado com functions
- [ ] ✅ Regras do Firestore atualizadas
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Testes de permissões realizados

---

## Próximos Passos

1. **Testar Registro de Usuário:**
   - Registrar novo usuário
   - Verificar se custom claims são definidos
   - Confirmar criação do documento no Firestore

2. **Testar Funções Admin:**
   - Promover usuário a admin
   - Testar listagem de usuários
   - Testar atualização de claims

3. **Configurar Monitoramento:**
   - Alertas de erro
   - Métricas de performance
   - Logs estruturados

4. **Documentar Processos:**
   - Manual do admin
   - Procedimentos de troubleshooting
   - Guia de manutenção

---

**⚠️ IMPORTANTE:** Teste todas as functions em ambiente de desenvolvimento antes de usar em produção. As custom claims são críticas para o controle de acesso.

**📞 Suporte:** Em caso de problemas, consulte os logs das functions e a [documentação oficial do Firebase Functions](https://firebase.google.com/docs/functions).
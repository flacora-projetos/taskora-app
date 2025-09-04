# Regras do Firestore para Usuários Autenticados

> **🔒 SEGURANÇA:** Estas regras substituem o modo anônimo por autenticação real com email/senha.

## Visão Geral

Com a implementação da autenticação por email/senha, as regras do Firestore foram atualizadas para:

- ✅ **Exigir autenticação real** (não mais anônima)
- ✅ **Associar dados ao usuário** via `auth.uid`
- ✅ **Manter isolamento por organização** via `orgId`
- ✅ **Proteger campos de auditoria** contra modificação
- ✅ **Validar estrutura de dados** no servidor

---

## Regras de Segurança do Firestore

### Arquivo: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================
    
    // Verifica se o usuário está autenticado
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // Verifica se o usuário pertence à organização
    function belongsToOrg(orgId) {
      return isAuthenticated() && 
             resource.data.orgId == orgId &&
             request.auth.token.orgId == orgId;
    }
    
    // Verifica se é uma criação válida
    function isValidCreation() {
      return isAuthenticated() &&
             request.resource.data.orgId == request.auth.token.orgId &&
             request.resource.data.createdBy == request.auth.uid &&
             request.resource.data.createdAt == request.time;
    }
    
    // Verifica se é uma atualização válida
    function isValidUpdate() {
      return isAuthenticated() &&
             resource.data.orgId == request.auth.token.orgId &&
             request.resource.data.orgId == resource.data.orgId &&
             request.resource.data.createdBy == resource.data.createdBy &&
             request.resource.data.createdAt == resource.data.createdAt &&
             request.resource.data.updatedAt == request.time;
    }
    
    // Valida campos obrigatórios para clientes
    function isValidClient() {
      return request.resource.data.keys().hasAll(['displayName', 'status', 'tier', 'orgId']) &&
             request.resource.data.displayName is string &&
             request.resource.data.displayName.size() > 0 &&
             request.resource.data.status in ['ATIVO', 'INATIVO', 'PROSPECT'] &&
             request.resource.data.tier in ['KEY_ACCOUNT', 'MID_TIER', 'LOW_TIER'];
    }
    
    // Valida campos obrigatórios para tarefas
    function isValidTask() {
      return request.resource.data.keys().hasAll(['title', 'clientRef', 'assigneeRef', 'status', 'orgId']) &&
             request.resource.data.title is string &&
             request.resource.data.title.size() > 0 &&
             request.resource.data.status in ['não realizada', 'em progresso', 'concluída', 'cancelada'] &&
             request.resource.data.priority in ['low', 'medium', 'high', 'urgent'];
    }
    
    // Valida campos obrigatórios para membros da equipe
    function isValidTeamMember() {
      return request.resource.data.keys().hasAll(['name', 'email', 'status', 'orgId']) &&
             request.resource.data.name is string &&
             request.resource.data.name.size() > 0 &&
             request.resource.data.email is string &&
             request.resource.data.email.matches('.*@.*\\..*') &&
             request.resource.data.status in ['Ativo', 'Inativo'];
    }
    
    // ========================================
    // REGRAS POR COLEÇÃO
    // ========================================
    
    // COLEÇÃO: clients
    match /clients/{clientId} {
      allow read: if belongsToOrg(resource.data.orgId);
      allow create: if isValidCreation() && isValidClient();
      allow update: if isValidUpdate() && isValidClient();
      allow delete: if belongsToOrg(resource.data.orgId);
    }
    
    // COLEÇÃO: tasks
    match /tasks/{taskId} {
      allow read: if belongsToOrg(resource.data.orgId);
      allow create: if isValidCreation() && isValidTask();
      allow update: if isValidUpdate() && isValidTask();
      allow delete: if belongsToOrg(resource.data.orgId);
    }
    
    // COLEÇÃO: team
    match /team/{memberId} {
      allow read: if belongsToOrg(resource.data.orgId);
      allow create: if isValidCreation() && isValidTeamMember();
      allow update: if isValidUpdate() && isValidTeamMember();
      allow delete: if belongsToOrg(resource.data.orgId);
    }
    
    // COLEÇÃO: projects
    match /projects/{projectId} {
      allow read: if belongsToOrg(resource.data.orgId);
      allow create: if isValidCreation();
      allow update: if isValidUpdate();
      allow delete: if belongsToOrg(resource.data.orgId);
    }
    
    // COLEÇÃO: settings
    match /settings/{settingId} {
      allow read: if belongsToOrg(resource.data.orgId);
      allow create: if isValidCreation();
      allow update: if isValidUpdate();
      allow delete: if belongsToOrg(resource.data.orgId);
    }
    
    // COLEÇÃO: users (perfis de usuário)
    match /users/{userId} {
      // Usuário só pode acessar seu próprio perfil
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ========================================
    // REGRAS PADRÃO (NEGAR TUDO)
    // ========================================
    
    // Negar acesso a qualquer outra coleção
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Como Aplicar as Regras

### Método 1: Firebase Console (Recomendado)

1. **Acessar o Firebase Console:**
   - Vá para: https://console.firebase.google.com/
   - Selecione o projeto **"dacora---tarefas"**

2. **Navegar para Firestore:**
   - No menu lateral, clique em **"Firestore Database"**
   - Clique na aba **"Rules"**

3. **Atualizar as Regras:**
   - Copie o código das regras acima
   - Cole no editor de regras
   - Clique em **"Publish"**

4. **Testar as Regras:**
   - Use o **"Rules Playground"** para testar cenários
   - Simule operações com diferentes usuários

### Método 2: Firebase CLI

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar projeto (se não tiver firestore.rules)
firebase init firestore

# Editar arquivo firestore.rules
# (copiar o conteúdo das regras acima)

# Fazer deploy das regras
firebase deploy --only firestore:rules
```

---

## Configuração de Custom Claims

Para que as regras funcionem corretamente, é necessário configurar **custom claims** para associar usuários às organizações.

### Cloud Function para Custom Claims

Crie uma Cloud Function para definir o `orgId` no token do usuário:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Função para definir custom claims após registro
exports.setUserClaims = functions.auth.user().onCreate(async (user) => {
  try {
    // Por padrão, todos os usuários pertencem à organização "dacora"
    const customClaims = {
      orgId: 'dacora',
      role: 'user'
    };
    
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    
    console.log(`Custom claims definidos para usuário ${user.uid}:`, customClaims);
    
  } catch (error) {
    console.error('Erro ao definir custom claims:', error);
  }
});

// Função para atualizar custom claims manualmente
exports.updateUserClaims = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  // Verificar se é admin (implementar lógica de admin)
  const isAdmin = context.auth.token.role === 'admin';
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem atualizar claims');
  }
  
  try {
    const { uid, orgId, role } = data;
    
    const customClaims = {
      orgId: orgId || 'dacora',
      role: role || 'user'
    };
    
    await admin.auth().setCustomUserClaims(uid, customClaims);
    
    return { success: true, claims: customClaims };
    
  } catch (error) {
    console.error('Erro ao atualizar custom claims:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});
```

### Deploy da Cloud Function

```bash
# Navegar para o diretório do projeto
cd /caminho/para/taskora-app

# Inicializar Functions (se não tiver)
firebase init functions

# Instalar dependências
cd functions
npm install firebase-admin firebase-functions

# Fazer deploy
firebase deploy --only functions
```

---

## Migração de Dados Existentes

Se você já tem dados no Firestore do modo anônimo, será necessário migrar:

### Script de Migração

```javascript
// migration-script.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  const collections = ['clients', 'tasks', 'team', 'projects', 'settings'];
  
  for (const collectionName of collections) {
    console.log(`Migrando coleção: ${collectionName}`);
    
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Adicionar campos de auditoria se não existirem
      if (!data.createdAt) {
        data.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }
      if (!data.createdBy) {
        data.createdBy = 'migration-script'; // ou UID de um usuário admin
      }
      if (!data.orgId) {
        data.orgId = 'dacora';
      }
      
      batch.update(doc.ref, data);
    });
    
    await batch.commit();
    console.log(`✅ ${collectionName} migrada com sucesso`);
  }
  
  console.log('🎉 Migração concluída!');
}

migrateData().catch(console.error);
```

---

## Testes das Regras

### Cenários de Teste

1. **Usuário Autenticado - Acesso Permitido:**
   ```javascript
   // Usuário: user123@example.com
   // Custom Claims: { orgId: 'dacora', role: 'user' }
   // Operação: Ler documento com orgId: 'dacora'
   // Resultado: ✅ PERMITIDO
   ```

2. **Usuário Não Autenticado - Acesso Negado:**
   ```javascript
   // Usuário: null (não autenticado)
   // Operação: Qualquer operação
   // Resultado: ❌ NEGADO
   ```

3. **Usuário de Outra Organização - Acesso Negado:**
   ```javascript
   // Usuário: user456@example.com
   // Custom Claims: { orgId: 'outra-org', role: 'user' }
   // Operação: Ler documento com orgId: 'dacora'
   // Resultado: ❌ NEGADO
   ```

4. **Criação com Campos Inválidos - Negado:**
   ```javascript
   // Operação: Criar cliente sem displayName
   // Resultado: ❌ NEGADO
   ```

### Executar Testes

```bash
# Instalar emulador do Firestore
npm install -g @firebase/rules-unit-testing

# Executar testes
firebase emulators:exec --only firestore "npm test"
```

---

## Monitoramento e Logs

### Configurar Alertas

1. **No Firebase Console:**
   - Vá em **"Firestore" > "Usage"**
   - Configure alertas para:
     - Operações negadas (security rule violations)
     - Picos de uso inesperados
     - Erros de validação

2. **No Google Cloud Console:**
   - Vá em **"Logging" > "Logs Explorer"**
   - Filtre por: `resource.type="firestore_database"`
   - Configure alertas para padrões suspeitos

### Logs Importantes

```
# Violações de regras de segurança
resource.type="firestore_database"
severity="ERROR"
protoPayload.methodName="google.firestore.v1.Firestore.Write"

# Tentativas de acesso não autorizado
resource.type="firestore_database"
protoPayload.authenticationInfo.principalEmail=""
```

---

## Checklist de Implementação

- [ ] ✅ Regras do Firestore atualizadas
- [ ] ✅ Custom claims configurados via Cloud Function
- [ ] ✅ Dados existentes migrados (se necessário)
- [ ] ✅ Testes de segurança executados
- [ ] ✅ Monitoramento e alertas configurados
- [ ] ✅ Documentação atualizada
- [ ] ✅ Equipe treinada nas novas regras

---

**⚠️ IMPORTANTE:** Teste todas as regras em ambiente de desenvolvimento antes de aplicar em produção. As regras de segurança são críticas para a proteção dos dados.

**📞 Suporte:** Em caso de dúvidas, consulte a [documentação oficial do Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started).
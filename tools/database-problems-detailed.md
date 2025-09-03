# Problemas Específicos da Migração - Análise Detalhada

## 🚨 Problemas Críticos Identificados

### **1. Números Decimais com Precisão Excessiva**

**Problema:** `totalHours: 49.000000000000002`

**Causa Raiz:**
```javascript
// Operações de ponto flutuante em JavaScript
0.1 + 0.2 = 0.30000000000000004
1.1 + 1.2 = 2.3000000000000003
```

**Locais Afetados:**
- `assets/js/data/tasksRepo.js` - Cálculos de horas
- `assets/js/data/clientsRepo.js` - Cálculos de orçamento
- `assets/js/pages/team.js` - Soma de horas por membro

**Código Problemático:**
```javascript
// tasksRepo.js - linha ~200
function calculateTotalHours(tasks) {
  return tasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  // Resultado: 49.000000000000002
}

// clientsRepo.js - linha ~150
function calculateTotalBudget(budgets) {
  return Object.values(budgets).reduce((sum, amount) => {
    return sum + (parseFloat(amount) || 0);
  }, 0);
  // Resultado: 15000.000000000002
}
```

**Solução:**
```javascript
// Implementar arredondamento em todos os cálculos
function roundToDecimals(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function calculateTotalHours(tasks) {
  const total = tasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  return roundToDecimals(total, 2);
}
```

---

### **2. Incompatibilidade de Tipos de Data**

**Problema:** Mistura de `Timestamp` e `string` para datas

**Schema Legado (DACORA):**
```javascript
{
  "createdAt": Timestamp(2025-01-15T10:30:00Z), // ÚNICO Timestamp
  "date": "2025-01-15",                        // String
  "dueDate": "2025-01-15"                      // String
}
```

**Schema Novo (TASKORA):**
```javascript
{
  "createdAt": Timestamp(2025-01-15T10:30:00Z),
  "updatedAt": Timestamp(2025-01-15T10:30:00Z),
  "startAt": Timestamp(2025-01-15T09:00:00Z),   // NOVO
  "dueAt": Timestamp(2025-01-15T18:00:00Z),    // CONFLITO com dueDate
  "reminderAt": Timestamp(2025-01-15T17:00:00Z), // NOVO
  "date": "2025-01-15"                         // Mantido como string
}
```

**Código Problemático:**
```javascript
// tasksRepo.js - mapUiToDb()
function mapUiToDb(uiPayload) {
  // PROBLEMA: Cria Timestamp quando legado espera string
  const dueAt = uiPayload.dueDate ? 
    serverTimestamp() : null; // ❌ Deveria ser string
    
  return {
    dueAt: dueAt, // ❌ Campo novo conflita com dueDate legado
    date: uiPayload.date // ✅ Mantém como string
  };
}
```

**Solução:**
```javascript
// Implementar compatibilidade bidirecional
function mapUiToDb(uiPayload, legacyMode = false) {
  if (legacyMode) {
    // Modo compatibilidade - manter strings
    return {
      dueDate: uiPayload.dueDate, // String
      date: uiPayload.date        // String
    };
  } else {
    // Modo novo - usar Timestamps
    return {
      dueAt: uiPayload.dueDate ? new Date(uiPayload.dueDate) : null,
      date: uiPayload.date
    };
  }
}
```

---

### **3. Referências Quebradas (DocumentReference vs String)**

**Problema:** Conversão de strings para DocumentReference falha

**Schema Legado:**
```javascript
{
  "client": "Flávio Corá",     // String simples
  "owner": "João Silva"       // String simples
}
```

**Schema Novo:**
```javascript
{
  "clientRef": DocumentReference(clients/3IUj895Vjjod5nWEG69),
  "assigneeRef": DocumentReference(team/abc123),
  "owner": "João Silva"  // Mantido para compatibilidade
}
```

**Código Problemático:**
```javascript
// tasksRepo.js - resolveClientRefByName()
async function resolveClientRefByName(clientName) {
  const db = await getDb();
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, where('displayName', '==', clientName));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error(`Cliente não encontrado: ${clientName}`);
    // ❌ Falha se cliente não existir na nova estrutura
  }
  
  return doc(db, 'clients', snapshot.docs[0].id);
}
```

**Problemas Identificados:**
1. **Cliente não existe** na coleção `clients`
2. **Nome não confere** exatamente (case-sensitive)
3. **Múltiplos clientes** com mesmo nome
4. **Coleção clients** não existe ou está vazia

**Solução:**
```javascript
// Implementar fallback robusto
async function resolveClientRefByName(clientName, createIfNotExists = false) {
  try {
    const db = await getDb();
    const clientsRef = collection(db, 'clients');
    
    // Busca case-insensitive
    const q = query(clientsRef, 
      where('displayName', '>=', clientName),
      where('displayName', '<=', clientName + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return doc(db, 'clients', snapshot.docs[0].id);
    }
    
    if (createIfNotExists) {
      // Criar cliente automaticamente
      const newClientRef = await createClient({
        name: clientName,
        status: 'ATIVO',
        tier: 'MID_TIER'
      });
      return newClientRef;
    }
    
    // Fallback: retornar string original
    console.warn(`Cliente não encontrado: ${clientName}. Usando string.`);
    return clientName;
    
  } catch (error) {
    console.error('Erro ao resolver cliente:', error);
    return clientName; // Fallback para string
  }
}
```

---

### **4. Campos Obrigatórios Ausentes**

**Problema:** Novos campos obrigatórios não existem em dados legados

**Campos Problemáticos:**
- `orgId` - Obrigatório no novo schema
- `assigneeRef` - Obrigatório para tarefas
- `clientRef` - Obrigatório para tarefas
- `updatedAt` - Esperado pelo código

**Código Problemático:**
```javascript
// tasksRepo.js - listTasks()
function renderTask(task) {
  const clientName = task.clientRef.displayName; // ❌ Pode ser undefined
  const assigneeName = task.assigneeRef.name;    // ❌ Pode ser undefined
  const orgId = task.orgId;                      // ❌ Pode ser undefined
}
```

**Solução:**
```javascript
// Implementar valores padrão e validação
function mapDbToUi(docSnap) {
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    orgId: data.orgId || 'dacora', // Valor padrão
    client: data.client || data.clientRef?.displayName || 'Cliente não informado',
    owner: data.owner || data.assigneeRef?.name || 'Não atribuído',
    // ... outros campos com fallbacks
  };
}
```

---

### **5. Problemas de Performance e Indexação**

**Problema:** Queries complexas sem índices adequados

**Queries Problemáticas:**
```javascript
// Busca por múltiplos campos sem índice composto
const q = query(tasksRef,
  where('orgId', '==', 'dacora'),
  where('status', '==', 'em progresso'),
  where('assigneeRef', '==', userRef),
  orderBy('dueAt', 'desc')
);
// ❌ Requer índice composto que pode não existir
```

**Solução:**
```javascript
// Simplificar queries e criar índices necessários
// 1. Query básica
const q1 = query(tasksRef,
  where('orgId', '==', 'dacora'),
  orderBy('createdAt', 'desc')
);

// 2. Filtrar em memória para campos secundários
const tasks = await getDocs(q1);
const filteredTasks = tasks.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(task => task.status === 'em progresso')
  .filter(task => task.owner === userName);
```

---

### **6. Problemas de Sincronização Team ↔ Tasks**

**Problema:** Integração Team depende de dados que podem não existir

**Código Problemático:**
```javascript
// tasks.js - NewTaskModal
async function loadResponsibles() {
  try {
    const teamMembers = await listTeamMembers(); // ❌ Pode falhar
    return teamMembers;
  } catch (error) {
    console.warn('Team não disponível, usando fallback');
    return await listOwners(); // ❌ Pode também falhar
  }
}
```

**Problemas:**
1. **Coleção team** pode não existir
2. **listOwners()** pode retornar dados inconsistentes
3. **Sincronização** pode criar loops infinitos
4. **Eventos** podem não ser disparados corretamente

**Solução:**
```javascript
// Implementar carregamento robusto
async function loadResponsibles() {
  const responsibles = [];
  
  try {
    // Tentar carregar do Team primeiro
    const teamMembers = await listTeamMembers();
    if (teamMembers && teamMembers.length > 0) {
      responsibles.push(...teamMembers);
    }
  } catch (error) {
    console.warn('Team não disponível:', error);
  }
  
  try {
    // Fallback: carregar owners únicos das tasks
    const uniqueOwners = await getUniqueTaskOwners();
    uniqueOwners.forEach(owner => {
      if (!responsibles.find(r => r.name === owner)) {
        responsibles.push({ name: owner, source: 'tasks' });
      }
    });
  } catch (error) {
    console.warn('Erro ao carregar owners:', error);
  }
  
  // Garantir pelo menos um responsável padrão
  if (responsibles.length === 0) {
    responsibles.push({ name: 'Não atribuído', source: 'default' });
  }
  
  return responsibles;
}
```

---

## 🛠️ Ferramentas de Correção Necessárias

### **1. Ferramenta de Arredondamento de Números**
```javascript
// fix-decimal-precision.js
function fixDecimalPrecision(collection, field, decimals = 2) {
  // Corrigir números com precisão excessiva
}
```

### **2. Ferramenta de Migração de Datas**
```javascript
// migrate-date-fields.js
function migrateDateFields(collection, mapping) {
  // Converter entre Timestamp e string conforme necessário
}
```

### **3. Ferramenta de Correção de Referências**
```javascript
// fix-document-references.js
function fixDocumentReferences(collection, field, targetCollection) {
  // Corrigir referências quebradas ou criar registros ausentes
}
```

### **4. Ferramenta de Validação de Schema**
```javascript
// validate-schema.js
function validateSchema(collection, expectedSchema) {
  // Validar se todos os campos obrigatórios existem
}
```

---

## 📊 Priorização de Correções

### **Prioridade CRÍTICA (Corrigir Imediatamente)**
1. ✅ **Números decimais longos** - Afeta exibição e cálculos
2. ✅ **Referências quebradas** - Impede carregamento de dados
3. ✅ **Campos obrigatórios ausentes** - Causa erros de aplicação

### **Prioridade ALTA (Corrigir em 1-2 dias)**
1. ⏳ **Incompatibilidade de datas** - Afeta filtros e ordenação
2. ⏳ **Problemas de performance** - Afeta experiência do usuário
3. ⏳ **Sincronização Team ↔ Tasks** - Afeta funcionalidades principais

### **Prioridade MÉDIA (Corrigir em 1 semana)**
1. ⏳ **Validação de schema** - Previne problemas futuros
2. ⏳ **Logs e monitoramento** - Facilita manutenção
3. ⏳ **Documentação atualizada** - Facilita desenvolvimento

---

*Análise detalhada realizada em: Janeiro 2025*  
*Status: Problemas identificados e soluções propostas*
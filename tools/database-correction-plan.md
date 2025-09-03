# Plano de Correção do Banco de Dados - Taskora v5.5.5

## 🎯 Objetivo
Corrigir os problemas identificados na migração de schema do Taskora, garantindo compatibilidade entre dados legados e nova estrutura, sem perda de dados e com mínimo impacto na operação.

---

## 📋 Resumo Executivo

### **Problemas Identificados:**
- ✅ **6 categorias críticas** de incompatibilidade
- ✅ **Dados corrompidos** com números decimais longos
- ✅ **Referências quebradas** entre coleções
- ✅ **Tipos de dados inconsistentes** (Timestamp vs String)
- ✅ **Campos obrigatórios ausentes** em dados legados
- ✅ **Performance degradada** por queries sem índices

### **Estratégia:**
1. **Correção imediata** de problemas críticos
2. **Migração gradual** para nova estrutura
3. **Manutenção de compatibilidade** com dados legados
4. **Monitoramento contínuo** da integridade

---

## 🚀 Fase 1: Correções Críticas Imediatas (1-2 dias)

### **1.1 Correção de Números Decimais Longos**
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 4 horas  
**Risco:** Baixo

**Ações:**
1. ✅ Criar ferramenta `fix-decimal-precision.html`
2. ✅ Executar correção em coleção `team` (campo `totalHours`)
3. ⏳ Executar correção em coleção `tasks` (campo `hours`)
4. ⏳ Executar correção em coleção `clients` (campos de orçamento)
5. ⏳ Atualizar código para arredondamento automático

**Código de Correção:**
```javascript
// Implementar em todos os repositórios
function roundToDecimals(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Aplicar em todos os cálculos
function calculateTotalHours(tasks) {
  const total = tasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  return roundToDecimals(total, 2);
}
```

**Arquivos a Modificar:**
- `assets/js/data/tasksRepo.js`
- `assets/js/data/clientsRepo.js`
- `assets/js/data/teamRepo.js`
- `assets/js/pages/team.js`

---

### **1.2 Correção de Referências Quebradas**
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 6 horas  
**Risco:** Médio

**Problema:** Tasks com `clientRef` apontando para clientes inexistentes

**Ações:**
1. ⏳ Identificar todas as referências quebradas
2. ⏳ Criar clientes ausentes automaticamente
3. ⏳ Implementar fallback robusto no código
4. ⏳ Adicionar validação antes de salvar

**Estratégia de Correção:**
```javascript
// 1. Identificar referências quebradas
async function findBrokenReferences() {
  const tasks = await getDocs(collection(db, 'tasks'));
  const brokenRefs = [];
  
  for (const task of tasks.docs) {
    const data = task.data();
    if (data.clientRef) {
      try {
        const clientDoc = await getDoc(data.clientRef);
        if (!clientDoc.exists()) {
          brokenRefs.push({ taskId: task.id, clientRef: data.clientRef });
        }
      } catch (error) {
        brokenRefs.push({ taskId: task.id, error: error.message });
      }
    }
  }
  
  return brokenRefs;
}

// 2. Corrigir referências quebradas
async function fixBrokenReferences(brokenRefs) {
  for (const ref of brokenRefs) {
    // Criar cliente padrão ou converter para string
    const defaultClient = await createClient({
      name: 'Cliente Migrado',
      status: 'ATIVO',
      tier: 'MID_TIER'
    });
    
    // Atualizar task com nova referência
    await updateDoc(doc(db, 'tasks', ref.taskId), {
      clientRef: defaultClient
    });
  }
}
```

---

### **1.3 Implementação de Fallbacks Robustos**
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 4 horas  
**Risco:** Baixo

**Ações:**
1. ⏳ Atualizar `mapDbToUi()` com fallbacks
2. ⏳ Atualizar `mapUiToDb()` com validação
3. ⏳ Implementar tratamento de erros robusto
4. ⏳ Adicionar logs detalhados

**Código de Fallback:**
```javascript
// tasksRepo.js - mapDbToUi() robusto
function mapDbToUi(docSnap) {
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    orgId: data.orgId || 'dacora',
    
    // Cliente - múltiplos fallbacks
    client: data.client || 
            data.clientRef?.displayName || 
            'Cliente não informado',
            
    // Responsável - múltiplos fallbacks
    owner: data.owner || 
           data.assigneeRef?.name || 
           'Não atribuído',
           
    // Horas - com arredondamento
    hours: roundToDecimals(
      data.hours || 
      (data.spentMinutes ? data.spentMinutes / 60 : 0), 
      2
    ),
    
    // Datas - compatibilidade bidirecional
    date: data.date || 
          (data.startAt ? formatDate(data.startAt) : ''),
    dueDate: data.dueDate || 
             (data.dueAt ? formatDate(data.dueAt) : ''),
             
    // Status - normalização
    status: normalizeStatus(data.status || 'não realizada'),
    
    // Timestamps com fallback
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || data.createdAt || new Date()
  };
}
```

---

## 🔧 Fase 2: Correções de Compatibilidade (3-5 dias)

### **2.1 Normalização de Tipos de Data**
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 8 horas  
**Risco:** Médio

**Problema:** Mistura de `Timestamp` e `string` para datas

**Estratégia:**
1. ⏳ Manter campos legados como `string`
2. ⏳ Adicionar campos novos como `Timestamp`
3. ⏳ Implementar sincronização bidirecional
4. ⏳ Migrar gradualmente conforme uso

**Mapeamento de Campos:**
```javascript
// Estratégia de coexistência
const dateFieldMapping = {
  // Legado (manter como string)
  'date': 'string',        // YYYY-MM-DD
  'dueDate': 'string',     // YYYY-MM-DD
  
  // Novo (adicionar como Timestamp)
  'startAt': 'Timestamp',  // Para filtros e ordenação
  'dueAt': 'Timestamp',    // Para filtros e ordenação
  'reminderAt': 'Timestamp', // Para notificações
  
  // Controle (sempre Timestamp)
  'createdAt': 'Timestamp',
  'updatedAt': 'Timestamp'
};
```

---

### **2.2 Migração de Coleção Clients**
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 6 horas  
**Risco:** Alto

**Problema:** Coleção `clients` pode não existir ou estar incompleta

**Ações:**
1. ⏳ Extrair clientes únicos das tasks existentes
2. ⏳ Criar registros na coleção `clients`
3. ⏳ Atualizar referências nas tasks
4. ⏳ Validar integridade das referências

**Script de Migração:**
```javascript
async function migrateClientsFromTasks() {
  // 1. Extrair clientes únicos das tasks
  const tasks = await getDocs(collection(db, 'tasks'));
  const uniqueClients = new Set();
  
  tasks.docs.forEach(doc => {
    const data = doc.data();
    if (data.client && typeof data.client === 'string') {
      uniqueClients.add(data.client);
    }
  });
  
  // 2. Criar registros de clientes
  const clientRefs = new Map();
  
  for (const clientName of uniqueClients) {
    const clientData = {
      orgId: 'dacora',
      displayName: clientName,
      status: 'ATIVO',
      tier: 'MID_TIER',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const clientRef = await addDoc(collection(db, 'clients'), clientData);
    clientRefs.set(clientName, clientRef);
  }
  
  // 3. Atualizar tasks com referências
  for (const taskDoc of tasks.docs) {
    const data = taskDoc.data();
    if (data.client && typeof data.client === 'string') {
      const clientRef = clientRefs.get(data.client);
      if (clientRef) {
        await updateDoc(doc(db, 'tasks', taskDoc.id), {
          clientRef: clientRef,
          // Manter campo original para compatibilidade
          client: data.client
        });
      }
    }
  }
}
```

---

### **2.3 Otimização de Performance**
**Prioridade:** 🟡 ALTA  
**Tempo estimado:** 4 horas  
**Risco:** Baixo

**Ações:**
1. ⏳ Simplificar queries complexas
2. ⏳ Implementar paginação eficiente
3. ⏳ Adicionar cache em memória
4. ⏳ Documentar índices necessários

**Otimizações:**
```javascript
// Antes: Query complexa sem índice
const complexQuery = query(tasksRef,
  where('orgId', '==', 'dacora'),
  where('status', '==', 'em progresso'),
  where('assigneeRef', '==', userRef),
  orderBy('dueAt', 'desc')
);

// Depois: Query simples + filtro em memória
const simpleQuery = query(tasksRef,
  where('orgId', '==', 'dacora'),
  orderBy('createdAt', 'desc'),
  limit(100)
);

const tasks = await getDocs(simpleQuery);
const filteredTasks = tasks.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(task => task.status === 'em progresso')
  .filter(task => task.owner === userName)
  .slice(0, 20); // Paginação
```

---

## 🔍 Fase 3: Validação e Monitoramento (2-3 dias)

### **3.1 Implementação de Validação**
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 6 horas  
**Risco:** Baixo

**Ações:**
1. ⏳ Criar schemas de validação
2. ⏳ Implementar validação antes de salvar
3. ⏳ Adicionar testes automatizados
4. ⏳ Criar relatórios de integridade

**Schema de Validação:**
```javascript
const taskSchema = {
  orgId: { type: 'string', required: true, default: 'dacora' },
  title: { type: 'string', required: true, minLength: 1 },
  status: { type: 'string', enum: ['não realizada', 'em progresso', 'concluída', 'cancelada'] },
  hours: { type: 'number', min: 0, max: 24, decimals: 2 },
  client: { type: 'string', required: true },
  owner: { type: 'string', required: true },
  date: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  createdAt: { type: 'Timestamp', required: true },
  updatedAt: { type: 'Timestamp', required: true }
};

function validateTask(taskData) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(taskSchema)) {
    const value = taskData[field];
    
    // Verificar campos obrigatórios
    if (rules.required && (value === undefined || value === null || value === '')) {
      if (rules.default !== undefined) {
        taskData[field] = rules.default;
      } else {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    }
    
    // Verificar tipos
    if (value !== undefined && rules.type) {
      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`Campo ${field} deve ser número`);
      }
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`Campo ${field} deve ser string`);
      }
    }
    
    // Verificar decimais
    if (rules.decimals && typeof value === 'number') {
      taskData[field] = roundToDecimals(value, rules.decimals);
    }
  }
  
  return { isValid: errors.length === 0, errors, data: taskData };
}
```

---

### **3.2 Sistema de Monitoramento**
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 4 horas  
**Risco:** Baixo

**Ações:**
1. ⏳ Implementar logs estruturados
2. ⏳ Criar dashboard de integridade
3. ⏳ Configurar alertas automáticos
4. ⏳ Implementar métricas de performance

**Sistema de Logs:**
```javascript
class DatabaseLogger {
  static log(level, operation, data, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level, // INFO, WARN, ERROR
      operation: operation, // CREATE, UPDATE, DELETE, QUERY
      collection: data.collection,
      documentId: data.documentId,
      userId: data.userId || 'system',
      error: error ? error.message : null,
      metadata: data.metadata || {}
    };
    
    console.log(`[${level}] ${operation}:`, logEntry);
    
    // Enviar para sistema de monitoramento externo
    if (level === 'ERROR') {
      this.sendAlert(logEntry);
    }
  }
  
  static sendAlert(logEntry) {
    // Implementar notificação para problemas críticos
    console.error('ALERTA CRÍTICO:', logEntry);
  }
}

// Uso nos repositórios
async function createTask(taskData) {
  try {
    const validation = validateTask(taskData);
    if (!validation.isValid) {
      DatabaseLogger.log('ERROR', 'CREATE', {
        collection: 'tasks',
        metadata: { validationErrors: validation.errors }
      });
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }
    
    const docRef = await addDoc(collection(db, 'tasks'), validation.data);
    
    DatabaseLogger.log('INFO', 'CREATE', {
      collection: 'tasks',
      documentId: docRef.id,
      metadata: { title: taskData.title }
    });
    
    return docRef;
  } catch (error) {
    DatabaseLogger.log('ERROR', 'CREATE', {
      collection: 'tasks',
      metadata: { taskData }
    }, error);
    throw error;
  }
}
```

---

## 📊 Fase 4: Ferramentas de Manutenção (1-2 dias)

### **4.1 Ferramenta de Diagnóstico Avançado**
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 4 horas

**Ações:**
1. ⏳ Expandir `database-schema-analyzer.html`
2. ⏳ Adicionar relatórios detalhados
3. ⏳ Implementar correções automáticas
4. ⏳ Criar interface de administração

---

### **4.2 Scripts de Backup e Restore**
**Prioridade:** 🟢 MÉDIA  
**Tempo estimado:** 3 horas

**Ações:**
1. ⏳ Criar script de backup completo
2. ⏳ Implementar restore seletivo
3. ⏳ Adicionar versionamento de dados
4. ⏳ Testar procedimentos de recuperação

---

## 📅 Cronograma de Execução

### **Semana 1 (Dias 1-2): Correções Críticas**
- **Dia 1 Manhã:** Correção de números decimais
- **Dia 1 Tarde:** Implementação de fallbacks
- **Dia 2 Manhã:** Correção de referências quebradas
- **Dia 2 Tarde:** Testes e validação

### **Semana 1 (Dias 3-5): Compatibilidade**
- **Dia 3:** Normalização de tipos de data
- **Dia 4:** Migração de coleção clients
- **Dia 5:** Otimização de performance

### **Semana 2 (Dias 1-3): Validação**
- **Dia 1-2:** Implementação de validação
- **Dia 3:** Sistema de monitoramento

### **Semana 2 (Dias 4-5): Ferramentas**
- **Dia 4:** Ferramentas de diagnóstico
- **Dia 5:** Scripts de backup e testes finais

---

## ⚠️ Riscos e Mitigações

### **Riscos Identificados:**
1. **Perda de dados** durante correções
   - **Mitigação:** Backup completo antes de cada fase
   
2. **Downtime da aplicação**
   - **Mitigação:** Correções em horários de baixo uso
   
3. **Incompatibilidade com dados existentes**
   - **Mitigação:** Manter compatibilidade bidirecional
   
4. **Performance degradada** durante migração
   - **Mitigação:** Processamento em lotes pequenos

### **Plano de Rollback:**
1. **Backup automático** antes de cada correção
2. **Versionamento** de schemas
3. **Scripts de reversão** para cada mudança
4. **Monitoramento** em tempo real durante execução

---

## ✅ Critérios de Sucesso

### **Métricas de Qualidade:**
- ✅ **0 números decimais longos** (>2 casas)
- ✅ **0 referências quebradas** em tasks
- ✅ **100% das tasks** com campos obrigatórios
- ✅ **<2s tempo de carregamento** para listagens
- ✅ **0 erros JavaScript** relacionados a dados

### **Funcionalidades Validadas:**
- ✅ **Listagem de tarefas** funciona corretamente
- ✅ **Criação de tarefas** salva dados válidos
- ✅ **Filtros** funcionam com dados migrados
- ✅ **Relatórios** exibem valores corretos
- ✅ **Sincronização Team ↔ Tasks** operacional

---

## 🚀 Próximos Passos Imediatos

1. ✅ **Executar backup completo** do Firebase
2. ⏳ **Implementar correção de números decimais**
3. ⏳ **Testar correções** em ambiente de desenvolvimento
4. ⏳ **Aplicar correções** em produção (horário de baixo uso)
5. ⏳ **Monitorar** integridade dos dados pós-correção

---

*Plano criado em: Janeiro 2025*  
*Versão: 1.0*  
*Status: Pronto para execução*
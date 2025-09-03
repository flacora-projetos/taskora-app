# Análise de Migração de Schema - Taskora v5.5.5

## 🚨 Problemas Identificados na Migração

Baseado na análise do código-fonte e schemas, foram identificados **conflitos críticos** entre o schema legado (SCHEMA_DACORA.md) e o novo schema (SCHEMA_TASKORA.md).

---

## 📊 Comparação de Schemas

### 1. **Coleção `tasks` - Incompatibilidades Críticas**

| Campo | Schema Legado (DACORA) | Schema Novo (TASKORA) | Status |
|-------|----------------------|----------------------|--------|
| `createdAt` | **Timestamp** (único campo de data) | **Timestamp** | ✅ Compatível |
| `date` | **string** (YYYY-MM-DD) | **string** (YYYY-MM-DD) | ✅ Compatível |
| `dueDate` | **string** (YYYY-MM-DD) | `dueAt` **Timestamp** | ❌ **CONFLITO** |
| `hours` | **number** (decimal) | **number** (decimal) | ✅ Compatível |
| `owner` | **string** (nome) | **string** (nome) | ✅ Compatível |
| `client` | **string** (nome) | `clientRef` **DocumentReference** | ❌ **CONFLITO** |
| `status` | **string** (livre) | **string** (enum específico) | ⚠️ **Parcial** |
| `assigneeRef` | ❌ Não existe | **DocumentReference** | ⚠️ **Novo campo** |
| `startAt` | ❌ Não existe | **Timestamp** | ⚠️ **Novo campo** |
| `reminderAt` | ❌ Não existe | **Timestamp** | ⚠️ **Novo campo** |
| `priority` | ❌ Não existe | **string** (enum) | ⚠️ **Novo campo** |

### 2. **Coleção `clients` - Nova Estrutura**

**Schema Legado:** ❌ Não existia
**Schema Novo:** ✅ Implementação completa

**Problema:** O aplicativo espera uma coleção `clients` estruturada, mas dados legados podem estar em formato diferente ou inexistente.

### 3. **Coleção `team` - Nova Estrutura**

**Schema Legado:** ❌ Não existia
**Schema Novo:** ✅ Implementação completa

**Problema:** Integração Team ↔ Tasks depende de dados estruturados que podem não existir.

---

## 🔍 Problemas Específicos Identificados

### **1. Campos de Data Inconsistentes**
```javascript
// LEGADO: dueDate como string
{
  "dueDate": "2025-01-15"
}

// NOVO: dueAt como Timestamp
{
  "dueAt": Timestamp(2025-01-15T00:00:00Z)
}
```

### **2. Referências vs Strings**
```javascript
// LEGADO: client como string
{
  "client": "Flávio Corá"
}

// NOVO: clientRef como DocumentReference
{
  "clientRef": DocumentReference(clients/3IUj895Vjjod5nWEG69)
}
```

### **3. Campos Numéricos com Precisão Excessiva**
**Problema observado:** `totalHours: 49.000000000000002`

**Causa:** Operações de ponto flutuante em JavaScript
**Impacto:** Exibição incorreta e possível corrupção de dados

### **4. Timestamps vs Strings**
```javascript
// LEGADO: Apenas createdAt como Timestamp
{
  "createdAt": Timestamp,
  "date": "2025-01-15",
  "dueDate": "2025-01-15"
}

// NOVO: Múltiplos Timestamps
{
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "startAt": Timestamp,
  "dueAt": Timestamp,
  "reminderAt": Timestamp
}
```

---

## 🛠️ Análise do Código de Migração

### **tasksRepo.js - Mapeamento UI ↔ DB**

**Problemas identificados:**
1. **Conversão de datas inconsistente**
2. **Resolução de referências pode falhar**
3. **Arredondamento de horas não implementado**
4. **Fallback para campos legados incompleto**

```javascript
// Código atual - Potencial problema
function mapUiToDb(uiPayload) {
  // Pode criar Timestamp quando legado espera string
  const dueAt = uiPayload.dueDate ? new Date(uiPayload.dueDate) : null;
  
  // Pode falhar se cliente não existir como DocumentReference
  const clientRef = await resolveClientRefByName(uiPayload.client);
}
```

### **clientsRepo.js - Nova Estrutura**

**Problemas identificados:**
1. **Assume coleção `clients` existe**
2. **Campos complexos (budgets, balanceControl) podem não existir**
3. **Referências cruzadas podem estar quebradas**

---

## 📈 Impacto nos Dados

### **Dados Corrompidos Observados:**
1. ✅ **Confirmado:** Números decimais longos (`49.000000000000002`)
2. ⚠️ **Suspeito:** Timestamps em campos que deveriam ser strings
3. ⚠️ **Suspeito:** DocumentReferences quebradas
4. ⚠️ **Suspeito:** Campos obrigatórios ausentes

### **Funcionalidades Afetadas:**
1. **Listagem de tarefas** - Pode falhar ao resolver referências
2. **Criação de tarefas** - Pode criar dados incompatíveis
3. **Filtros** - Podem não funcionar com dados inconsistentes
4. **Relatórios** - Cálculos podem estar incorretos
5. **Sincronização** - Team ↔ Tasks pode falhar

---

## 🎯 Estratégia de Correção Recomendada

### **Fase 1: Diagnóstico Completo**
1. ✅ Executar `database-schema-analyzer.html`
2. ✅ Identificar todos os tipos de dados inconsistentes
3. ✅ Mapear campos corrompidos por coleção
4. ✅ Quantificar registros afetados

### **Fase 2: Correção de Dados**
1. **Arredondar números decimais** para 2 casas
2. **Normalizar campos de data** (manter strings onde esperado)
3. **Corrigir referências quebradas** ou converter para strings
4. **Validar campos obrigatórios**

### **Fase 3: Atualização do Código**
1. **Implementar fallbacks robustos** para compatibilidade
2. **Adicionar validação de tipos** antes de salvar
3. **Corrigir arredondamento automático** em cálculos
4. **Melhorar tratamento de erros**

### **Fase 4: Migração Gradual**
1. **Manter compatibilidade** com dados legados
2. **Migrar dados gradualmente** conforme uso
3. **Implementar versionamento** de schema
4. **Monitorar integridade** dos dados

---

## ⚠️ Recomendações Imediatas

1. **NÃO executar migrações automáticas** até análise completa
2. **Fazer backup completo** do Firebase antes de qualquer correção
3. **Testar correções** em ambiente de desenvolvimento primeiro
4. **Implementar logs detalhados** para monitorar mudanças
5. **Criar ferramentas de rollback** para reverter mudanças se necessário

---

## 📝 Próximos Passos

1. ✅ **Executar diagnóstico completo** com `database-schema-analyzer.html`
2. ⏳ **Documentar problemas específicos** encontrados
3. ⏳ **Criar plano de correção detalhado** baseado nos resultados
4. ⏳ **Implementar correções pontuais** para problemas críticos
5. ⏳ **Testar compatibilidade** com dados corrigidos

---

*Análise realizada em: Janeiro 2025*  
*Versão do aplicativo: taskora_v5.5.5_secure_firebase.html*  
*Status: Investigação em andamento*
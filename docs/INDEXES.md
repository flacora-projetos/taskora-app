# INDEXES.md

## 📌 Visão Geral
Este documento lista os índices necessários no **Firestore** para que o Taskora v5.3 funcione de forma eficiente.  
Esses índices refletem as **consultas realmente implementadas** no código, não mais especulações teóricas.

⚠️ Importante:  
- O app permanece com **UI da Dácora** e assinatura **"powered by Taskora"**.
- Os índices aqui descritos devem ser criados no console do Firebase (ou via `firestore.indexes.json`).
- **Versão atual:** `taskora_v5.3_history_module.html`
- **Baseado na implementação real** dos repositórios e consultas

---

## 📂 Índices por Coleção Implementada

### 1. `tasks` ✅ IMPLEMENTADO
**Repositório:** `assets/js/data/tasksRepo.js`

#### **Consultas Implementadas:**

##### **listTasks(max = 500)**
```javascript
// Consulta básica com filtros globais
let q = query(
  collection(db, 'tasks'),
  where('orgId', '==', orgId),
  orderBy('updatedAt', 'desc'),
  limit(max)
);

// Com filtros aplicados:
// - status: where('status', '==', status)
// - clientRef: where('clientRef', '==', clientRef)
// - assigneeRef: where('assigneeRef', '==', assigneeRef)
```

##### **listTasksByDateRange(startDate, endDate, max = 1000)**
```javascript
// Consulta por intervalo de datas (calendário)
let q = query(
  collection(db, 'tasks'),
  where('orgId', '==', orgId),
  where('dueAt', '>=', startTimestamp),
  where('dueAt', '<=', endTimestamp),
  orderBy('dueAt', 'asc'),
  limit(max)
);
```

#### **Índices Necessários:**
```json
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "dueAt", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "clientRef", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "tasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "assigneeRef", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```

---

### 2. `clients` ✅ IMPLEMENTADO
**Repositório:** `assets/js/data/clientsRepo.js`

#### **Consultas Implementadas:**

##### **listClients(filters = {})**
```javascript
// Consulta básica
let q = query(
  collection(db, 'clients'),
  where('orgId', '==', orgId),
  orderBy('updatedAt', 'desc'),
  limit(max)
);

// Com filtros aplicados:
// - status: where('status', '==', status)
// - tier: where('tier', '==', tier)
// - responsible: where('responsible', '==', responsible)
```

##### **getClientsStats()**
```javascript
// Consulta para estatísticas (todos os clientes)
const q = query(
  collection(db, 'clients'),
  where('orgId', '==', orgId)
);
```

##### **getResponsibles()**
```javascript
// Consulta para lista de responsáveis únicos
const q = query(
  collection(db, 'clients'),
  where('orgId', '==', orgId)
);
```

#### **Índices Necessários:**
```json
{
  "collectionGroup": "clients",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "clients",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "clients",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "tier", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "clients",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "responsible", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "clients",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "orgId", "order": "ASCENDING" },
    { "fieldPath": "displayName", "order": "ASCENDING" }
  ]
}
```

---

### 3. `calendarEvents` ⚠️ NÃO IMPLEMENTADO COMO COLEÇÃO
**Status:** Eventos derivados diretamente de `tasks` via `listTasksByDateRange()`

**Implementação atual:**
- Usa os mesmos índices da coleção `tasks`
- Filtros por `dueAt` para intervalo de datas
- Renderização no grid do calendário

---

### 4. `taskActivities` ⚠️ NÃO IMPLEMENTADO
**Status:** Módulo de histórico lê diretamente de `tasks`

**Implementação atual:**
- Usa consultas da coleção `tasks` filtradas por cliente e período
- Não requer índices adicionais além dos já definidos para `tasks`

---

### 5. `settingsOrg` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder

### 6. `settingsUser` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder

### 7. `insightsDaily` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder

---

## 📑 Arquivo JSON Completo para Firebase

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "dueAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "clientRef", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "assigneeRef", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "tier", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "responsible", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "displayName", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 🎯 Consultas Específicas por Módulo

### **Módulo de Tarefas**
- **Listagem geral:** `orgId + updatedAt desc`
- **Por intervalo de datas:** `orgId + dueAt asc` (calendário)
- **Filtros:** `orgId + status + updatedAt desc`
- **Por cliente:** `orgId + clientRef + updatedAt desc`
- **Por responsável:** `orgId + assigneeRef + updatedAt desc`

### **Módulo de Clientes**
- **Listagem geral:** `orgId + updatedAt desc`
- **Por status:** `orgId + status + updatedAt desc`
- **Por tier:** `orgId + tier + updatedAt desc`
- **Por responsável:** `orgId + responsible + updatedAt desc`
- **Busca por nome:** `orgId + displayName asc`

### **Módulo de Calendário**
- **Eventos do mês:** `orgId + dueAt asc` (usa índices de tasks)
- **Com filtros globais:** Combina com filtros de status/cliente/responsável

### **Módulo de Histórico**
- **Por cliente:** `orgId + clientRef + updatedAt desc` (usa índices de tasks)
- **Por período:** `orgId + dueAt asc` (usa índices de tasks)
- **Timeline:** Agrupamento feito no código, não no banco

---

## ⚡ Performance e Otimização

### **Índices Críticos (Alta Prioridade)**
1. `tasks: orgId + updatedAt desc` - Listagem principal
2. `tasks: orgId + dueAt asc` - Calendário
3. `clients: orgId + updatedAt desc` - Listagem principal

### **Índices de Filtros (Média Prioridade)**
1. `tasks: orgId + status + updatedAt desc`
2. `tasks: orgId + clientRef + updatedAt desc`
3. `clients: orgId + status + updatedAt desc`

### **Índices de Busca (Baixa Prioridade)**
1. `clients: orgId + displayName asc`
2. `tasks: orgId + assigneeRef + updatedAt desc`
3. `clients: orgId + tier + updatedAt desc`

---

## ✅ Observação Final

- **Índices baseados na implementação real** do código v5.3
- **Consultas documentadas** refletem exatamente o que está implementado
- **Funcionalidades não implementadas** claramente marcadas como ⚠️
- **Performance otimizada** para as consultas mais frequentes
- **Compatível com filtros globais** e sistemas de busca implementados
- **UI Dácora white label** mantida com "powered by Taskora"

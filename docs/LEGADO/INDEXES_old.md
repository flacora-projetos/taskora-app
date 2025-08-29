# INDEXES.md

## 📌 Visão Geral
Este documento lista os índices necessários no **Firestore** para que o Taskora funcione de forma eficiente.  
Esses índices refletem o **novo schema Taskora**, não mais o legado da Dácora.  

⚠️ Importante:  
- O app permanece com **UI da Dácora** e assinatura **“powered by Taskora”**.  
- Os índices aqui descritos devem ser criados no console do Firebase (ou via `firestore.indexes.json`).

---

## 📂 Índices por Coleção

### 1. `tasks`
Consultas comuns: filtrar por status, responsável, cliente e tags.  

**Índices compostos:**
- `(orgId ASC, status ASC, dueAt DESC)`  
- `(orgId ASC, assigneeRef ASC, dueAt DESC)`  
- `(orgId ASC, clientRef ASC, updatedAt DESC)`  
- `(orgId ASC, tags ARRAY_CONTAINS, updatedAt DESC)`

---

### 2. `calendarEvents`
Consultas comuns: buscar eventos por intervalo de datas e/ou responsável.  

**Índices compostos:**
- `(orgId ASC, startAt ASC)`  
- `(orgId ASC, assigneeRef ASC, startAt ASC)`

---

### 3. `clients`
Consultas comuns: listar clientes ativos, buscar por nome.  

**Índices compostos:**
- `(orgId ASC, status ASC, updatedAt DESC)`  
- `(orgId ASC, displayName ASC)`

---

### 4. `taskActivities`
Consultas comuns: exibir histórico de uma tarefa em ordem cronológica.  

**Índices compostos:**
- `(orgId ASC, taskRef ASC, createdAt ASC)`

---

### 5. `insightsDaily`
Consultas comuns: relatórios diários por organização.  

**Índice simples recomendado:**
- `(orgId ASC, generatedAt DESC)`

---

## 📑 Modelo JSON (exemplo para `firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "assigneeRef", "order": "ASCENDING" },
        { "fieldPath": "dueAt", "order": "DESCENDING" }
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
  ]
}

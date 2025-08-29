# FIRESTORE_RULES.md

## 📌 Visão Geral
Essas regras de segurança aplicam-se ao banco de dados **Taskora v5.3**.  
Elas garantem que cada organização veja apenas seus próprios dados, respeitem papéis de usuário e mantenham consistência nos campos críticos.

⚠️ Importante:  
- O app continua com **UI da Dácora**, exibindo **"powered by Taskora"**.  
- As regras aqui descritas são baseadas na **implementação atual** do sistema.
- **Versão atual:** `taskora_v5.3_history_module.html`
- **Autenticação:** Anônima habilitada (sem tela de login)

---

## 🔑 Princípios Implementados

1. **Isolamento por organização (`orgId`)**  
   - Cada documento contém `orgId`.  
   - Usuário só pode acessar docs com `orgId` igual ao da sua sessão.

2. **Autenticação anônima**  
   - Sistema configurado para **autenticação anônima**
   - Sem necessidade de tela de login
   - Acesso direto ao aplicativo

3. **Proteção de campos de auditoria**  
   - `createdAt`, `createdBy`, `orgId` não podem ser alterados pelo client.  
   - `updatedAt` deve ser sempre sobrescrito pelo servidor.

4. **Validação de dados implementada**  
   - Campos obrigatórios validados no código
   - Referências validadas via `resolveClientRefByName()` e `resolveAssigneeRefByName()`
   - Sistema de horas validado (HH:MM → decimal → HH:MM)

---

## 🧩 Regras por Coleção Implementada

### 1. `clients` ✅ IMPLEMENTADO
**Repositório:** `assets/js/data/clientsRepo.js`

#### **Permissões Implementadas:**
- **Leitura:** Qualquer usuário autenticado da organização
- **Escrita:** Sistema permite CRUD completo via interface
- **Validação:** Campos obrigatórios validados no código

#### **Campos Obrigatórios Validados:**
- `displayName` (obrigatório)
- `status` (Ativo, Inativo, Prospect)
- `tier` (Key Account, Mid Tier, Low Tier)

#### **Campos Opcionais:**
- `email`, `phone`, `website`, `instagram`
- `entryDate`, `responsible`, `documents`, `notes`
- Orçamentos por plataforma (`budgetMetaAds`, `budgetGoogleAds`, etc.)
- Plataformas ativas (`platformMetaAds`, `platformGoogleAds`, etc.)

#### **Eventos em Tempo Real:**
```javascript
// Emite evento após mudanças
function emitClientsChanged(action, clientId) {
  const event = new CustomEvent('taskora:clients:changed', {
    detail: { action, clientId, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
}
```

---

### 2. `tasks` ✅ IMPLEMENTADO
**Repositório:** `assets/js/data/tasksRepo.js`

#### **Permissões Implementadas:**
- **Leitura:** Todos da organização via `listTasks()` e `listTasksByDateRange()`
- **Escrita:** CRUD completo via interface
- **Filtros:** Integração com sistema de filtros globais

#### **Campos Obrigatórios Validados:**
- `clientRef` (obrigatório, validado via `resolveClientRefByName()`)
- `title` (obrigatório)
- `assigneeRef` (obrigatório, validado via `resolveAssigneeRefByName()`)

#### **Sistema de Horas Validado:**
```javascript
// Validação de entrada HH:MM
function minutesFromHHMM(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return (h * 60) + m;
}

// Conversão para decimal (armazenamento)
dbPayload.hours = minutesFromHHMM(uiPayload.hours) / 60;
```

#### **Soft Delete Implementado:**
- Campo `deletedAt` usado em vez de exclusão real
- Mantém auditoria e histórico

#### **Eventos em Tempo Real:**
```javascript
function emitTasksChanged(op, id) {
  try {
    const evt = new CustomEvent('taskora:tasks:changed', {
      detail: { op, id, ts: Date.now() }
    });
    window.dispatchEvent(evt);
  } catch (err) {
    console.warn('[TasksRepo] Erro ao emitir evento:', err);
  }
}
```

---

### 3. `calendarEvents` ⚠️ NÃO IMPLEMENTADO COMO COLEÇÃO
**Implementação atual:** Eventos derivados diretamente de `tasks`

#### **Sistema Atual:**
- **Fonte:** `listTasksByDateRange()` da coleção `tasks`
- **Renderização:** Pills coloridas por status no calendário
- **Filtros:** Integração com filtros globais
- **Grid:** Sistema perfeito 7x6 sem overflow

---

### 4. `taskActivities` ⚠️ NÃO IMPLEMENTADO
**Status:** Módulo de histórico lê diretamente de `tasks`

#### **Implementação Atual do Histórico:**
- **Fonte:** Coleção `tasks` filtrada por cliente e período
- **Agrupamento:** Por mês com estatísticas calculadas
- **Timeline:** Visual com dots coloridos por status
- **Filtros:** Sistema avançado implementado

---

### 5. `settingsOrg` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder em `assets/js/pages/settings.js`

### 6. `settingsUser` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder em `assets/js/pages/settings.js`

### 7. `insightsDaily` ⚠️ NÃO IMPLEMENTADO
**Status:** Apenas placeholder em `assets/js/pages/insights.js`

---

## 🔒 Segurança Implementada

### **Autenticação Anônima**
```javascript
// Configuração em assets/js/config/firebase-test.js
window.firebaseConfig = {
  // Configuração do Firebase
  // Autenticação anônima habilitada
};
```

### **Isolamento de Dados**
- **orgId:** Presente em todos os documentos
- **Consultas filtradas:** Sempre incluem `orgId` nas queries
- **Validação:** Referências cruzadas validadas no código

### **Validação de Referências**
```javascript
// Validação de cliente
async function resolveClientRefByName(db, clientName) {
  // Busca cliente por nome na organização
  // Retorna DocumentReference válida
}

// Validação de responsável
async function resolveAssigneeRefByName(db, ownerName) {
  // Busca usuário por nome na organização
  // Retorna DocumentReference válida
}
```

### **Proteção de Campos Críticos**
- **Timestamps:** `createdAt`, `updatedAt` gerenciados pelo sistema
- **Referências:** Validadas antes da gravação
- **Formato de dados:** Normalização automática (datas, horas, etc.)

---

## 📊 Consultas e Filtros Implementados

### **Sistema de Filtros Globais**
```javascript
// Integração com TaskoraFilters
if (window.TaskoraFilters) {
  const filters = window.TaskoraFilters.getFilters();
  // Aplica filtros de data, status, cliente, responsável
}
```

### **Filtros por Módulo**

#### **Clientes:**
- Status, Tier, Responsável, Faixa de orçamento
- Número de plataformas ativas, Presença digital
- Busca por nome, email, responsável, website, Instagram

#### **Tarefas:**
- Status, Cliente, Responsável, Prioridade
- Intervalo de datas (startAt, dueAt)
- Integração com filtros globais

#### **Calendário:**
- Intervalo de datas automático
- Filtros globais aplicados
- Visualização por mês com grid perfeito

#### **Histórico:**
- Cliente específico ou "Todos os Clientes"
- Status, responsável, intervalo de datas
- Filtros rápidos (Hoje, Ontem, Esta semana, etc.)

---

## 🎯 Regras de Negócio Implementadas

### **Clientes**
1. **Nome obrigatório:** `displayName` sempre requerido
2. **Status válido:** Apenas Ativo, Inativo, Prospect
3. **Tier válido:** Apenas Key Account, Mid Tier, Low Tier
4. **Orçamentos:** Valores numéricos ≥ 0
5. **Plataformas:** Boolean para cada plataforma ativa

### **Tarefas**
1. **Cliente obrigatório:** `clientRef` sempre requerido
2. **Título obrigatório:** `title` sempre requerido
3. **Responsável obrigatório:** `assigneeRef` sempre requerido
4. **Horas válidas:** Formato HH:MM convertido para decimal
5. **Status válido:** não realizada, em progresso, concluída, cancelada
6. **Prioridade válida:** low, medium, high, urgent

### **Sistema de Horas**
1. **Entrada:** Sempre em formato HH:MM
2. **Validação:** Números válidos para horas e minutos
3. **Armazenamento:** Decimal para cálculos
4. **Exibição:** Conversão de volta para HH:MM
5. **Fallback:** Compatibilidade com campos legados

---

## ✅ Observação Final

- **Regras baseadas na implementação real** do código v5.3
- **Autenticação anônima** habilitada para acesso direto
- **Validações implementadas no código** JavaScript, não no Firestore
- **Sistema de eventos** para atualizações em tempo real
- **Filtros avançados** implementados em cada módulo
- **UI Dácora white label** mantida com "powered by Taskora"
- **Segurança por isolamento** via `orgId` em todas as consultas

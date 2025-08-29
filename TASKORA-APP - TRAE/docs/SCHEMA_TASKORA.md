# SCHEMA_TASKORA.md

## 📌 Visão Geral
Este documento define a **estrutura de dados oficial do Taskora**, substituindo o antigo `SCHEMA_DACORA.md`.  
Ele organiza coleções, campos e tipos utilizados pelo aplicativo, garantindo consistência, segurança e escalabilidade.  

⚠️ Importante:  
- O front-end permanece com a identidade **Dácora**, exibindo “powered by Taskora”.  
- Esta definição trata apenas do **back-end (Firestore)**.

---

## 📂 Coleções Principais

### 1. `clients/{clientId}`
Representa cada cliente atendido pela organização.

**Campos principais:**
- `orgId` *(string)* → vínculo da organização.  
- `displayName` *(string, obrigatório)* → nome do cliente.  
- `cnpj` *(string, opcional)* → normalizado (somente dígitos).  
- `email` *(string, opcional)*  
- `phone` *(string, opcional)*  
- `status` *(enum: `ATIVO|INATIVO|PROSPECT`)*  
- `tags` *(array<string>)* → todas lowercase.  
- `defaultAssigneeRef` *(DocumentReference→orgUsers)* → responsável padrão para novas tarefas.  
- `createdAt` *(Timestamp)*  
- `updatedAt` *(Timestamp)*  

**Subcoleção `budgets/{budgetId}`:**  
Orçamentos mensais por plataforma de marketing.  
- `platform` *(enum: `META_ADS|GOOGLE_ADS|TIKTOK_ADS|PINTEREST_ADS|LINKEDIN_ADS|OTHER`)*  
- `month` *(string, formato `YYYY-MM`)*  
- `amountBRL` *(number, >=0)* → valor em reais.  
- `notes` *(string, opcional)*  
- `createdAt` *(Timestamp)*  

---

### 2. `tasks/{taskId}`
Representa as tarefas atribuídas a clientes e usuários.

**Campos principais:**
- `orgId` *(string)*  
- `clientRef` *(DocumentReference→clients, obrigatório)*  
- `title` *(string, obrigatório)*  
- `description` *(string, opcional)*  
- `status` *(enum: `NAO_REALIZADA|EM_PROGRESSO|CONCLUIDA|CANCELADA`)*  
- `assigneeRef` *(DocumentReference→orgUsers, obrigatório)*  
- `priority` *(enum: `LOW|MEDIUM|HIGH|URGENT`)*  
- `tags` *(array<string>)*  
- `startAt` *(Timestamp|null)*  
- `dueAt` *(Timestamp|null)*  
- `reminderAt` *(Timestamp|null)*  
- `estimatedMinutes` *(number, >=0)* → tempo estimado em minutos.  
- `spentMinutes` *(number, >=0)* → tempo real gasto em minutos.  
- `createdBy` *(DocumentReference→orgUsers)*  
- `createdAt` *(Timestamp)*  
- `updatedAt` *(Timestamp)*  
- `deletedAt` *(Timestamp|null)*  

---

### 3. `calendarEvents/{eventId}`
Eventos exibidos no calendário, podendo estar ou não vinculados a tarefas.

**Campos principais:**
- `orgId` *(string)*  
- `taskRef` *(DocumentReference→tasks|null)*  
- `title` *(string, obrigatório)*  
- `startAt` *(Timestamp, obrigatório)*  
- `endAt` *(Timestamp, obrigatório)*  
- `allDay` *(boolean)*  
- `assigneeRef` *(DocumentReference→orgUsers)*  
- `clientRef` *(DocumentReference→clients)*  
- `tags` *(array<string>)*  
- `source` *(enum: `TASK|MANUAL`)*  
- `createdAt` *(Timestamp)*  
- `updatedAt` *(Timestamp)*  

---

### 4. `taskActivities/{activityId}`
Histórico/auditoria das tarefas.

**Campos principais:**
- `orgId` *(string)*  
- `taskRef` *(DocumentReference→tasks)*  
- `actorRef` *(DocumentReference→orgUsers)*  
- `type` *(enum: `CREATED|STATUS_CHANGED|EDITED|TIME_LOGGED|COMMENT|ATTACH_ADDED|ATTACH_REMOVED`)*  
- `payload` *(map)* → detalhes da ação (ex.: `{from: "EM_PROGRESSO", to: "CONCLUIDA"}`).  
- `createdAt` *(Timestamp)*  

---

### 5. `settingsOrg/{orgId}`
Configurações da organização.

**Campos principais:**
- `theme` *(enum: `LIGHT|DARK`)*  
- `businessHours` *(map, ex.: `{monFri: "09:00-18:00"}`)*  
- `defaultStatusFlow` *(array<string>)*  
- `notifications` *(map)*  

---

### 6. `settingsUser/{userId}`
Preferências de cada usuário.

**Campos principais:**
- `theme` *(enum: `LIGHT|DARK`)*  
- `timeZone` *(string)*  
- `notifyChannels` *(array<enum: `EMAIL|PUSH`>)*  
- `calendarViewDefault` *(enum: `MONTH|WEEK|DAY`)*  

---

### 7. `insightsDaily/{orgId}_YYYYMMDD`
Agregações diárias para relatórios e dashboards.

**Campos principais:**
- `tasksCreated` *(number)*  
- `tasksCompleted` *(number)*  
- `hoursLogged` *(number)*  
- `byStatus` *(map)*  
- `byAssignee` *(map)*  
- `byClient` *(map)*  
- `generatedAt` *(Timestamp)*  

---

## ⚖️ Convenções

- **Timestamps:** sempre em UTC (`createdAt`, `updatedAt`, `deletedAt`).  
- **Tags:** lowercase, máximo 20 por documento.  
- **Enums:** armazenados em strings canônicas (`CONCLUIDA`, `URGENT`).  
- **Soft delete:** via `deletedAt`, mantendo auditoria.  
- **DocumentReferences:** usados em vez de IDs soltos (`clientRef`, `assigneeRef`).  

---

## 🔍 Consultas típicas (e índices relacionados)

- **Tarefas:**  
  - `(orgId, status, dueAt desc)`  
  - `(orgId, assigneeRef, dueAt desc)`  
  - `(orgId, clientRef, updatedAt desc)`  
  - `(orgId, tags array_contains, updatedAt desc)`  

- **Calendário:**  
  - `(orgId, startAt asc)`  
  - `(orgId, assigneeRef, startAt asc)`  

- **Clientes:**  
  - `(orgId, status, updatedAt desc)`  
  - `(orgId, displayName asc)`  

- **Histórico:**  
  - `(orgId, taskRef, createdAt asc)`  

---

## ✅ Observação Final

- Esse schema é a base oficial do Taskora.  
- Ele substitui totalmente o antigo `SCHEMA_DACORA.md`.  
- As mudanças refletem a nova estratégia: **Taskora independente**, mantendo **UI Dácora white label**.

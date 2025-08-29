# SCHEMA_TASKORA.md

## 📌 Visão Geral
Este documento define a **estrutura de dados oficial do Taskora v5.3**, baseada na implementação real do código.  
Ele organiza coleções, campos e tipos utilizados pelo aplicativo, garantindo consistência, segurança e escalabilidade.  

⚠️ Importante:  
- O front-end permanece com a identidade **Dácora**, exibindo "powered by Taskora".  
- Esta definição reflete o **back-end (Firestore) realmente implementado**.
- **Versão atual:** `taskora_v5.3_history_module.html`

---

## 📂 Coleções Implementadas

### 1. `clients/{clientId}` ✅ IMPLEMENTADO
Representa cada cliente atendido pela organização.

**Campos implementados:**
- `orgId` *(string)* → vínculo da organização  
- `displayName` *(string, obrigatório)* → nome do cliente  
- `email` *(string, opcional)*  
- `phone` *(string, opcional)*  
- `website` *(string, opcional)*  
- `instagram` *(string, opcional)*  
- `status` *(enum: `ATIVO|INATIVO|PROSPECT`)* → implementado como `Ativo|Inativo|Prospect`
- `tier` *(enum: `KEY_ACCOUNT|MID_TIER|LOW_TIER`)* → implementado como `Key Account|Mid Tier|Low Tier`
- `defaultAssigneeRef` *(DocumentReference→orgUsers)* → responsável padrão  
- `entryDate` *(string, formato YYYY-MM-DD)* → data de entrada
- `responsible` *(string)* → nome do responsável
- `documents` *(string)* → links de documentos
- `notes` *(string)* → observações
- `createdAt` *(Timestamp)*  
- `updatedAt` *(Timestamp)*  

**Orçamentos por plataforma (implementado como campos diretos):**
- `budgetMetaAds` *(number)* → Meta Ads (Facebook/Instagram)
- `budgetGoogleAds` *(number)* → Google Ads
- `budgetTikTokAds` *(number)* → TikTok Ads
- `budgetLinkedInAds` *(number)* → LinkedIn Ads
- `budgetYouTubeAds` *(number)* → YouTube Ads
- `budgetPinterestAds` *(number)* → Pinterest Ads
- `budgetTwitterAds` *(number)* → Twitter Ads
- `budgetSnapchatAds` *(number)* → Snapchat Ads
- `budgetOther` *(number)* → Outras Plataformas

**Plataformas ativas (implementado como campos boolean):**
- `platformMetaAds` *(boolean)*
- `platformGoogleAds` *(boolean)*
- `platformTikTokAds` *(boolean)*
- `platformLinkedInAds` *(boolean)*
- `platformYouTubeAds` *(boolean)*
- `platformPinterestAds` *(boolean)*
- `platformTwitterAds` *(boolean)*
- `platformSnapchatAds` *(boolean)*
- `platformOther` *(boolean)*

**Constantes implementadas:**
```javascript
MARKETING_PLATFORMS = {
  META_ADS: 'Meta Ads (Facebook/Instagram)',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK_ADS: 'TikTok Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  YOUTUBE_ADS: 'YouTube Ads',
  PINTEREST_ADS: 'Pinterest Ads',
  TWITTER_ADS: 'Twitter Ads',
  SNAPCHAT_ADS: 'Snapchat Ads',
  OTHER: 'Outras Plataformas'
}

CLIENT_TIERS = {
  KEY_ACCOUNT: 'Key Account',
  MID_TIER: 'Mid Tier',
  LOW_TIER: 'Low Tier'
}

CLIENT_STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  PROSPECT: 'Prospect'
}
```

---

### 2. `tasks/{taskId}` ✅ IMPLEMENTADO
Representa as tarefas atribuídas a clientes e usuários.

**Campos implementados:**
- `orgId` *(string)*  
- `clientRef` *(DocumentReference→clients, obrigatório)*  
- `title` *(string, obrigatório)*  
- `description` *(string, opcional)*  
- `status` *(string)* → implementado como: `não realizada|em progresso|concluída|cancelada`
- `assigneeRef` *(DocumentReference→orgUsers, obrigatório)*  
- `priority` *(string)* → implementado como: `low|medium|high|urgent`
- `startAt` *(Timestamp|null)*  
- `dueAt` *(Timestamp|null)*  
- `reminderAt` *(Timestamp|null)*  
- `hours` *(number)* → **CAMPO PRINCIPAL** - tempo em formato decimal (ex: 1.5 = 1h30min)
- `estimatedMinutes` *(number, >=0)* → tempo estimado em minutos (campo legado)
- `spentMinutes` *(number, >=0)* → tempo real gasto em minutos (campo legado)
- `date` *(string, formato YYYY-MM-DD)* → data derivada de startAt/dueAt
- `createdBy` *(DocumentReference→orgUsers)*  
- `createdAt` *(Timestamp)*  
- `updatedAt` *(Timestamp)*  
- `deletedAt` *(Timestamp|null)*  

**Sistema de horas implementado:**
- **Entrada:** HH:MM (interface do usuário)
- **Armazenamento:** Campo `hours` em decimal (1.5 = 1h30min)
- **Exibição:** HH:MM (convertido de decimal)
- **Fallback:** Campos `estimatedMinutes`/`spentMinutes` para compatibilidade

**Mapeamento UI ↔ DB implementado:**
```javascript
// mapUiToDb: Prioriza campo hours decimal
if (uiPayload.hours) {
  dbPayload.hours = minutesFromHHMM(uiPayload.hours) / 60; // decimal
}

// mapDbToUi: Lê campo hours com fallback
const hours = docData.hours || (docData.spentMinutes ? docData.spentMinutes / 60 : 0);
uiData.hours = hhmmFromMinutes(Math.round(hours * 60));
```

---

### 3. `calendarEvents/{eventId}` ⚠️ REFERENCIADO (não implementado como coleção separada)
Eventos do calendário são derivados diretamente das tarefas via `listTasksByDateRange()`.

**Implementação atual:**
- **Fonte:** Coleção `tasks` filtrada por intervalo de datas
- **Campos derivados:** `title`, `startAt`, `dueAt`, `status`, `clientRef`, `assigneeRef`
- **Renderização:** Pills coloridas por status no grid do calendário

---

### 4. `taskActivities/{activityId}` ⚠️ NÃO IMPLEMENTADO
Histórico/auditoria das tarefas (planejado mas não implementado).

**Status:** O módulo de histórico atual lê diretamente da coleção `tasks`, não de uma coleção de atividades separada.

---

### 5. `settingsOrg/{orgId}` ⚠️ NÃO IMPLEMENTADO
Configurações da organização (apenas placeholder).

### 6. `settingsUser/{userId}` ⚠️ NÃO IMPLEMENTADO
Preferências de cada usuário (apenas placeholder).

### 7. `insightsDaily/{orgId}_YYYYMMDD` ⚠️ NÃO IMPLEMENTADO
Agregações diárias para relatórios (apenas placeholder).

---

## ⚖️ Convenções Implementadas

### **Timestamps**
- **Formato:** UTC (`createdAt`, `updatedAt`, `deletedAt`)
- **Parsing robusto:** Suporte a Date, ms, 'YYYY-MM-DD' e 'dd/mm/aaaa'
- **Normalização:** Formato americano (MM/DD/YYYY) para compatibilidade

### **Sistema de Horas**
- **Entrada:** HH:MM (usuário)
- **Processamento:** Conversão para minutos → decimal
- **Armazenamento:** Campo `hours` em decimal
- **Exibição:** Conversão decimal → HH:MM

### **Referências**
- **DocumentReferences:** Usados para `clientRef`, `assigneeRef`
- **Resolução por nome:** Funções `resolveClientRefByName()`, `resolveAssigneeRefByName()`

### **Eventos em Tempo Real**
- **Sistema implementado:** CustomEvents para atualizações automáticas
- **Eventos:** `taskora:clients:changed`, `taskora:tasks:changed`
- **Payload:** `{ action, clientId/taskId, timestamp }`

---

## 🔍 Consultas Implementadas

### **Tarefas**
```javascript
// Listagem com filtros globais
listTasks(max = 500) // Aplica TaskoraFilters automaticamente

// Por intervalo de datas (calendário)
listTasksByDateRange(startDate, endDate, max = 1000)

// Filtros suportados: status, cliente, responsável, datas
```

### **Clientes**
```javascript
// Listagem com filtros
listClients(filters = {}) // Status, tier, responsável, orçamento

// Estatísticas
getClientsStats() // Total, orçamento, key accounts, ativos

// Responsáveis
getResponsibles() // Lista de responsáveis únicos
```

### **Histórico**
```javascript
// Baseado em tasks filtradas por cliente e período
// Agrupa por mês com estatísticas calculadas
// Timeline visual com dots coloridos por status
```

---

## 🎨 Implementação de Status e Cores

### **Status de Tarefas**
```javascript
const statusColors = {
  'concluída': { bg: '#DCFCE7', fg: '#166534', bd: '#BBF7D0' },
  'em progresso': { bg: '#DBEAFE', fg: '#1E40AF', bd: '#BFDBFE' },
  'iniciada': { bg: '#FEF3C7', fg: '#92400E', bd: '#FDE68A' },
  'não realizada': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' }
};
```

### **Tiers de Clientes**
```javascript
const tierColors = {
  'KEY_ACCOUNT': { bg: '#FEF3C7', fg: '#92400E', bd: '#F59E0B' },
  'MID_TIER': { bg: '#DBEAFE', fg: '#1E40AF', bd: '#3B82F6' },
  'LOW_TIER': { bg: '#F3F4F6', fg: '#374151', bd: '#9CA3AF' }
};
```

---

## ✅ Observação Final

- **Schema baseado na implementação real** do código v5.3
- **Campos documentados** refletem exatamente o que está no código
- **Funcionalidades não implementadas** claramente marcadas como ⚠️
- **Sistema de horas** documentado conforme implementação atual
- **Eventos em tempo real** documentados conforme sistema implementado
- **UI Dácora white label** mantida com "powered by Taskora"

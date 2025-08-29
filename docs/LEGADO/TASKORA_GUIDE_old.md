# TASKORA_GUIDE.md

## 📌 Visão Geral

O **Taskora** é a base tecnológica do aplicativo utilizado pela **Dácora**.  
No front-end, a identidade visual **permanece 100% como Dácora**, com a assinatura **“powered by Taskora”**.  
Toda a evolução descrita aqui é **estrutural e técnica**, não alterando a UI ou branding.

O Taskora organiza informações em cinco módulos principais:
- **Clientes**  
- **Tarefas**  
- **Calendário**  
- **Insights** (em desenvolvimento)  
- **Ajustes**

---

## 🔑 Mudanças Recentes

- Fim da obrigatoriedade de compatibilidade direta com o banco da Dácora.  
- Criação de um **schema próprio do Taskora**, mais limpo e padronizado.  
- Adicionado campo `defaultAssigneeRef` em clientes.  
- Adicionada subcoleção `budgets` em clientes (orçamentos mensais por plataforma de mídia).  
- Alterado formato de tempo em tarefas: agora armazenado em **minutos inteiros**, exibido em **HH:MM**.  
- Criada coleção `taskActivities` para histórico/auditoria de tarefas.  
- Atualizadas regras de segurança baseadas em `orgId` e papéis (`viewer`, `member`, `admin`).  
- Definidos índices otimizados para consultas de clientes, tarefas e calendário.

---

## 🧩 Estrutura dos Módulos

### 1. Clientes
- **Campos principais:**  
  - `displayName`, `cnpj`, `email`, `phone`, `status`, `tags`  
  - `defaultAssigneeRef` (responsável padrão para novas tarefas)  
- **Subcoleção `budgets`:**  
  - `platform` (Meta Ads, Google Ads, TikTok, Pinterest etc.)  
  - `month` (YYYY-MM)  
  - `amountBRL` (número em reais)  
  - `notes`  
- **Exemplo de uso:**  
  - Cliente "Padaria Sol" com orçamentos distintos em plataformas de marketing.  
  - Ao criar uma tarefa para esse cliente, o `assigneeRef` padrão pode ser herdado.

---

### 2. Tarefas
- **Campos principais:**  
  - `clientRef`, `title`, `description`, `status`, `assigneeRef`, `priority`, `tags`  
  - `startAt`, `dueAt`, `reminderAt`  
  - `estimatedMinutes`, `spentMinutes`  
- **Formato de tempo:**  
  - O usuário informa **HH:MM**, e o sistema converte para minutos.  
  - Evita decimais como 0,1h (6 minutos).  
- **Regras:**  
  - `assigneeRef` é obrigatório (se não informado, usa o `defaultAssigneeRef` do cliente).  
  - Soft delete via campo `deletedAt`.

---

### 3. Calendário
- **Coleção própria `calendarEvents`.**  
- Pode ou não estar vinculado a uma tarefa (`taskRef`).  
- Campos: `title`, `startAt`, `endAt`, `allDay`, `assigneeRef`, `clientRef`, `tags`, `source`.  
- Usado para exibir tarefas e eventos manuais em visões de **mês/semana/dia**.

---

### 4. Histórico de Tarefas
- **Coleção `taskActivities`** (ou subcoleção em `tasks`).  
- Guarda cada alteração feita: criação, mudança de status, comentários, tempo logado.  
- Permite auditoria e linha do tempo por tarefa.

---

### 5. Ajustes
- **Por usuário (`settingsUser`):**  
  - tema claro/escuro, fuso horário, preferências de notificação.  
- **Por organização (`settingsOrg`):**  
  - horário comercial, fluxo de status, políticas de notificação.

---

### 6. Insights (futuro)
- Será usado para relatórios e métricas.  
- Baseado em dados agregados por dia, cliente e responsável.  
- Ex.: tarefas concluídas no mês, tempo gasto por cliente, orçamento vs. gasto real.

---

## 🔒 Segurança

- Todos os documentos têm campo `orgId` → usuários só acessam docs da sua organização.  
- Papéis:  
  - **Viewer:** leitura.  
  - **Member:** cria/edita suas tarefas.  
  - **Admin:** gerencia clientes, orçamentos, configurações.  
- Campos de auditoria (`createdAt`, `createdBy`) não podem ser alterados pelo client.  
- Limite de `tags.length <= 20`.

---

## ⚡ Índices Atuais

- **Tarefas:** por `status+dueAt`, por `assigneeRef+dueAt`, por `clientRef+updatedAt`, por `tags+updatedAt`.  
- **Calendário:** por `startAt`, por `assigneeRef+startAt`.  
- **Clientes:** por `status+updatedAt`, por `displayName`.  
- **Histórico:** por `taskRef+createdAt`.

---

## 📅 Fluxo de Trabalho

1. Criar/editar cliente.  
2. Definir responsável padrão (`defaultAssigneeRef`).  
3. Definir orçamentos mensais em `budgets`.  
4. Criar tarefas vinculadas a clientes.  
5. Acompanhar no calendário e registrar tempo gasto.  
6. Consultar histórico (`taskActivities`).  
7. Ajustar preferências em `settingsUser` e `settingsOrg`.  

---

## ✅ Observação Final

- **UI e branding continuam da Dácora.**  
- Todas as melhorias descritas são **internas** (estrutura de dados, regras, índices, segurança).  
- O app continua sendo entregue como **white label**, “Dácora powered by Taskora”.

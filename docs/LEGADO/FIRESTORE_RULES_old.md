# FIRESTORE_RULES.md

## 📌 Visão Geral
Essas regras de segurança aplicam-se ao banco de dados **Taskora**.  
Elas garantem que cada organização veja apenas seus próprios dados, respeitem papéis de usuário e mantenham consistência nos campos críticos.

⚠️ Importante:  
- O app continua com **UI da Dácora**, exibindo **“powered by Taskora”**.  
- As regras aqui descritas substituem as antigas do banco legado (Dácora).

---

## 🔑 Princípios Gerais

1. **Isolamento por organização (`orgId`)**  
   - Cada documento contém `orgId`.  
   - Usuário só pode acessar docs com `orgId` igual ao da sua sessão.

2. **Papéis e permissões**  
   - `viewer`: apenas leitura.  
   - `member`: leitura + criação/edição de tarefas próprias.  
   - `admin`: total acesso à organização (clientes, orçamentos, configurações).  

3. **Proteção de campos de auditoria**  
   - `createdAt`, `createdBy`, `orgId` não podem ser alterados pelo client.  
   - `updatedAt` deve ser sempre sobrescrito pelo servidor.

4. **Validação de dados**  
   - `tags.length <= 20`  
   - `amountBRL >= 0` em budgets  
   - `estimatedMinutes >= 0` e `spentMinutes >= 0`  
   - `status` e `priority` devem corresponder aos enums permitidos  
   - `dueAt` e `startAt` devem ser Timestamps válidos

---

## 🧩 Regras por Coleção

### 1. `clients`
- Qualquer usuário autenticado da organização pode ler.  
- Somente `admin` pode criar/editar/excluir.  
- Campos obrigatórios: `displayName`, `status`.  
- `defaultAssigneeRef` deve apontar para usuário válido da mesma `orgId`.

---

### 2. `clients/{clientId}/budgets`
- Leitura: todos os membros da organização.  
- Escrita: apenas `admin`.  
- Campos obrigatórios: `platform`, `month`, `amountBRL`.  
- `month` deve seguir padrão `YYYY-MM`.  

---

### 3. `tasks`
- Leitura: todos da organização.  
- Escrita:  
  - `member` pode criar/editar tarefas atribuídas a si mesmo.  
  - `admin` pode criar/editar qualquer tarefa.  
- `clientRef` deve referenciar cliente da mesma organização.  
- `assigneeRef` é obrigatório (ou herdado de `defaultAssigneeRef`).  
- `estimatedMinutes` e `spentMinutes` em inteiros ≥ 0.  
- Soft delete: `deletedAt` usado em vez de exclusão real.

---

### 4. `calendarEvents`
- Leitura: todos da organização.  
- Escrita:  
  - `member` pode criar eventos para si mesmo.  
  - `admin` pode criar/editar qualquer evento.  
- Campos obrigatórios: `title`, `startAt`, `endAt`.  
- Se vinculado a `taskRef`, deve existir e pertencer à mesma `orgId`.

---

### 5. `taskActivities`
- Leitura: todos da organização.  
- Escrita: apenas via servidor (Cloud Function ou Admin SDK).  
- `actorRef` e `createdAt` atribuídos automaticamente.  
- Não pode ser alterado após criado (append-only).  

---

### 6. `settingsOrg`
- Leitura: todos da organização.  
- Escrita: apenas `admin`.  
- Campos aceitos: `theme`, `businessHours`, `defaultStatusFlow`, `notifications`.

---

### 7. `settingsUser`
- Usuário só pode ler/escrever o seu próprio doc (`userId` == auth.uid).  
- Campos aceitos: `theme`, `timeZone`, `notifyChannels`, `calendarViewDefault`.  

---

### 8. `insightsDaily`
- Apenas leitura por todos da organização.  
- Escrita restrita ao servidor (jobs de agregação).  

---

## ✅ Observação Final
- Essas regras garantem segurança multi-tenant, integridade dos dados e respeito aos papéis.  
- Elas substituem integralmente o documento antigo do banco legado (Dácora).  
- O app continua **white label**: usuários finais verão Dácora, mas toda a base é Taskora.

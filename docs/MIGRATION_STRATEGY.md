# ESTRATÉGIA DE MIGRAÇÃO - DÁCORA → TASKORA

## 📌 Visão Geral
Este documento define a estratégia completa para migração dos dados do banco da **Dácora** para o **Taskora independente**, garantindo integridade, consistência e mínima interrupção do serviço.

**Status:** Em desenvolvimento  
**Versão:** 1.0  
**Data:** Janeiro 2025  
**Responsável:** Equipe Taskora  

---

## 🎯 Objetivos da Migração

### **Principais:**
- Tornar o Taskora **100% independente** do banco da Dácora
- Migrar **todos os dados históricos** sem perda de informação
- Manter **compatibilidade total** com a UI existente
- Garantir **zero downtime** durante a migração

### **Secundários:**
- Otimizar estrutura de dados para melhor performance
- Implementar novos recursos (budgets, team, histórico)
- Estabelecer base sólida para futuras evoluções

---

## 📊 Análise do Estado Atual

### **Banco da Dácora (Origem)**
**Coleção Principal:** `tasks`

| Campo | Tipo | Observações |
|-------|------|-------------|
| `client` | string | Nome do cliente (texto livre) |
| `createdAt` | timestamp | Único campo em Timestamp |
| `date` | string | Data base (formato: YYYY-MM-DD) |
| `description` | string | Descrição da tarefa |
| `dueDate` | string | Prazo (formato: YYYY-MM-DD) |
| `hours` | number | Horas em decimal (ex: 0.5) |
| `owner` | string | Responsável (texto livre) |
| `status` | string | Status livre (ex: "todo", "doing", "done") |
| `recurrence` | map | Objeto com propriedades de recorrência |
| `recurrence.type` | string | Tipo: "none", "weekdays", "custom" |
| `recurrence.days` | array | Array de dias |
| `recurrence.recurrenceType` | string | Tipo adicional |
| `recurrence.recurrenceUntil` | string | Data limite |

### **Taskora (Destino)**
**Coleções Implementadas:**
- `clients/{clientId}` - Clientes com orçamentos
- `tasks/{taskId}` - Tarefas com referências
- `team/{memberId}` - Equipe (novo)
- `taskActivities/{activityId}` - Histórico (novo)

---

## 🔄 Mapeamento de Dados

### **1. Migração de Tarefas: `tasks` → `tasks`**

| Campo Dácora | Campo Taskora | Transformação |
|--------------|---------------|---------------|
| `client` | `clientRef` | Resolver referência via `resolveClientRefByName()` |
| `owner` | `assigneeRef` | Resolver referência via `resolveAssigneeRefByName()` |
| `description` | `description` | Direto |
| `status` | `status` | Normalizar para enum padrão |
| `hours` | `hours` | Converter para sistema HH:MM |
| `date` | `startAt` | Converter string → Timestamp |
| `dueDate` | `dueAt` | Converter string → Timestamp |
| `createdAt` | `createdAt` | Direto |
| `recurrence.*` | `recurrence.*` | Preservar estrutura |
| - | `orgId` | Definir como "dacora" |
| - | `priority` | Definir como "MEDIUM" |
| - | `updatedAt` | serverTimestamp() |

### **2. Extração de Clientes: `tasks.client` → `clients`**

**Processo:**
1. Extrair lista única de clientes das tarefas
2. Criar documentos na coleção `clients`
3. Definir campos padrão

| Campo | Valor Padrão | Observações |
|-------|--------------|-------------|
| `displayName` | Nome extraído | Limpar e normalizar |
| `orgId` | "dacora" | Fixo |
| `status` | "Ativo" | Padrão |
| `tier` | "Mid Tier" | Padrão |
| `entryDate` | Data da migração | YYYY-MM-DD |
| `responsible` | "A definir" | Padrão |
| `createdAt` | serverTimestamp() | Automático |
| `updatedAt` | serverTimestamp() | Automático |

### **3. Extração de Equipe: `tasks.owner` → `team`**

**Processo:**
1. Extrair lista única de responsáveis das tarefas
2. Criar documentos na coleção `team`
3. Definir campos padrão

| Campo | Valor Padrão | Observações |
|-------|--------------|-------------|
| `name` | Nome extraído | Limpar e normalizar |
| `email` | `${nome.toLowerCase()}@dacora.com.br` | Gerar email padrão |
| `orgId` | "dacora" | Fixo |
| `specialty` | ["Gestão de Projetos"] | Padrão |
| `level` | "Pleno" | Padrão |
| `status` | "Ativo" | Padrão |
| `createdAt` | serverTimestamp() | Automático |
| `updatedAt` | serverTimestamp() | Automático |

---

## 🛠️ Estratégia de Implementação

### **Fase 1: Preparação (1-2 dias)**
1. **Backup completo** do Firebase da Dácora
2. **Análise detalhada** dos dados existentes
3. **Validação** da estrutura atual
4. **Preparação** do ambiente de testes

### **Fase 2: Desenvolvimento dos Scripts (2-3 dias)**
1. **Script de análise** - `analyze-dacora-data.html`
2. **Script de migração** - `migrate-dacora-to-taskora.html`
3. **Script de validação** - `validate-migration.html`
4. **Script de rollback** - `rollback-migration.html`

### **Fase 3: Testes (2-3 dias)**
1. **Teste em ambiente isolado**
2. **Validação de integridade**
3. **Teste de performance**
4. **Validação da UI**

### **Fase 4: Migração em Produção (1 dia)**
1. **Backup final**
2. **Execução da migração**
3. **Validação pós-migração**
4. **Ativação do Taskora independente**

---

## 🔍 Validações Necessárias

### **Pré-Migração**
- [ ] Backup completo realizado
- [ ] Scripts testados em ambiente isolado
- [ ] Mapeamento de dados validado
- [ ] Plano de rollback definido

### **Durante a Migração**
- [ ] Logs detalhados de cada operação
- [ ] Contadores de registros migrados
- [ ] Validação de integridade em tempo real
- [ ] Monitoramento de erros

### **Pós-Migração**
- [ ] Contagem total de registros
- [ ] Validação de referências cruzadas
- [ ] Teste de funcionalidades críticas
- [ ] Performance das consultas

---

## 🚨 Plano de Contingência

### **Cenários de Risco**
1. **Falha na migração de tarefas**
   - Rollback automático
   - Restauração do backup
   - Análise de logs de erro

2. **Perda de referências**
   - Script de correção de referências
   - Mapeamento manual se necessário
   - Validação cruzada

3. **Problemas de performance**
   - Otimização de índices
   - Ajuste de consultas
   - Monitoramento contínuo

### **Rollback Strategy**
- **Backup automático** antes da migração
- **Script de rollback** para reverter alterações
- **Documentação** de todos os passos
- **Tempo estimado** de rollback: 30 minutos

---

## 📋 Checklist de Execução

### **Preparação**
- [ ] Documentar estado atual do banco
- [ ] Criar backup completo
- [ ] Preparar ambiente de testes
- [ ] Desenvolver scripts de migração
- [ ] Testar scripts em ambiente isolado

### **Migração**
- [ ] Executar backup final
- [ ] Executar script de análise
- [ ] Executar migração de clientes
- [ ] Executar migração de equipe
- [ ] Executar migração de tarefas
- [ ] Validar integridade dos dados

### **Pós-Migração**
- [ ] Testar todas as funcionalidades
- [ ] Validar performance
- [ ] Documentar resultados
- [ ] Ativar Taskora independente
- [ ] Monitorar por 48h

---

## 📈 Métricas de Sucesso

### **Quantitativas**
- **100%** dos dados migrados sem perda
- **0** erros críticos durante a migração
- **< 2 horas** de tempo total de migração
- **< 30 segundos** de downtime (se houver)

### **Qualitativas**
- Todas as funcionalidades operando normalmente
- Performance igual ou superior ao estado anterior
- UI funcionando sem alterações visíveis
- Usuários não percebem diferença na experiência

---

## 🔧 Ferramentas Necessárias

### **Scripts de Migração**
1. `analyze-dacora-data.html` - Análise dos dados atuais
2. `migrate-dacora-to-taskora.html` - Migração principal
3. `validate-migration.html` - Validação pós-migração
4. `rollback-migration.html` - Rollback se necessário

### **Utilitários**
- Firebase Admin SDK para operações em lote
- Scripts de backup automatizado
- Ferramentas de monitoramento
- Logs estruturados para auditoria

---

## ✅ Próximos Passos

1. **Desenvolver scripts de migração** baseados nesta estratégia
2. **Implementar validações** de integridade de dados
3. **Criar estratégia de backup** automatizada
4. **Testar processo** em ambiente controlado
5. **Planejar execução** em produção

---

## 📝 Observações Finais

- Esta migração marca a **independência total** do Taskora
- A **UI Dácora** será mantida como white label
- Todos os **dados históricos** serão preservados
- O processo é **reversível** através do plano de rollback
- **Monitoramento contínuo** será implementado pós-migração

**Documento vivo** - será atualizado conforme o progresso da implementação.
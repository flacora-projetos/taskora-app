# PLANO DE IMPLEMENTAÇÃO ESTRUTURADO - TASKORA

## 📋 RESUMO EXECUTIVO

**Objetivo:** Implementar migração limpa e estruturada do Dacora para Taskora seguindo o schema v5.5.5 oficial com configuração segura do Firebase.

**Estratégia:** Implementação em 6 etapas sequenciais com validação em cada passo.

---

## 🎯 ETAPAS DE IMPLEMENTAÇÃO

### **ETAPA 1: Implementar Schema Completo do Taskora**

**Objetivo:** Criar estrutura de dados oficial do Taskora v5.5.5 no Firebase com configuração segura

**Ações:**
- ✅ Implementar coleção `clients` com schema completo
- ✅ Implementar coleção `tasks` com schema v5.5
- ✅ Implementar coleção `team` (integração v5.5)
- ✅ Configurar índices necessários no Firestore
- ✅ Validar estrutura criada

**Schema Clients (Campos Obrigatórios):**
```javascript
{
  orgId: 'dacora',
  displayName: string, // OBRIGATÓRIO
  email: string,
  phone: string,
  website: string,
  instagram: string,
  status: 'ATIVO|INATIVO|PROSPECT',
  tier: 'KEY_ACCOUNT|MID_TIER|LOW_TIER',
  defaultAssigneeRef: DocumentReference,
  entryDate: 'YYYY-MM-DD',
  responsible: string,
  paymentMethod: 'BOLETO|PIX|CREDIT_CARD',
  documents: string,
  notes: string,
  
  // Orçamentos por plataforma
  budgetMetaAds: number,
  budgetGoogleAds: number,
  budgetTikTokAds: number,
  budgetPinterestAds: number,
  
  // Plataformas ativas
  platformMetaAds: boolean,
  platformGoogleAds: boolean,
  platformTikTokAds: boolean,
  platformPinterestAds: boolean,
  
  // Performance
  realBilling: number,
  realLeads: number,
  billingGoal: number,
  leadsGoal: number,
  roi: number,
  
  // Controle de saldo
  balanceControl: {
    metaAds: { lastDeposit, depositDate, dailyBudget },
    googleAds: { lastDeposit, depositDate, dailyBudget },
    tiktokAds: { lastDeposit, depositDate, dailyBudget },
    pinterestAds: { lastDeposit, depositDate, dailyBudget }
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Schema Tasks (Campos Obrigatórios):**
```javascript
{
  orgId: 'dacora',
  clientRef: DocumentReference, // OBRIGATÓRIO
  title: string, // OBRIGATÓRIO
  description: string,
  status: 'não realizada|em progresso|concluída|cancelada',
  assigneeRef: DocumentReference, // OBRIGATÓRIO
  owner: string, // Integração Team v5.5
  priority: 'low|medium|high|urgent',
  startAt: Timestamp,
  dueAt: Timestamp,
  reminderAt: Timestamp,
  hours: number, // Campo principal (decimal)
  estimatedMinutes: number, // Legado
  spentMinutes: number, // Legado
  date: 'YYYY-MM-DD',
  createdBy: DocumentReference,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: Timestamp
}
```

---

### **ETAPA 2: Importar Tarefas Legadas (Dacora)**

**Objetivo:** Migrar todas as tarefas do Dacora para o novo schema Tasks

**Fonte de Dados:** `dacora-export-2025-09-02.json` → coleção `tasks`

**Mapeamento de Campos:**
```javascript
// Dacora → Taskora
{
  // Campos diretos
  description: data.description,
  status: mapStatus(data.status), // Concluída → concluída
  owner: data.owner,
  hours: data.hours || 0,
  
  // Campos derivados
  title: data.description.substring(0, 100) + '...', // Gerar título
  clientRef: findClientByName(data.client), // Referência ao cliente
  date: data.date || data.dueDate,
  startAt: parseDate(data.date),
  dueAt: parseDate(data.dueDate),
  
  // Campos padrão
  orgId: 'dacora',
  priority: 'medium',
  assigneeRef: findUserByOwner(data.owner),
  estimatedMinutes: Math.round((data.hours || 0) * 60),
  spentMinutes: Math.round((data.hours || 0) * 60),
  createdAt: data.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

**Mapeamento de Status:**
- `"Concluída"` → `"concluída"`
- `"Em Progresso"` → `"em progresso"`
- `"Não Realizada"` → `"não realizada"`
- `"Cancelada"` → `"cancelada"`

**Validações:**
- ✅ Todos os campos obrigatórios preenchidos
- ✅ Referências válidas para clientes
- ✅ Formato de datas correto
- ✅ Status dentro dos valores permitidos

---

### **ETAPA 3: Importar SOMENTE Nomes dos Clientes**

**Objetivo:** Criar registros mínimos de clientes com apenas nomes dos dados legados

**Fonte de Dados:** Extrair nomes únicos de `client` das tarefas do Dacora

**Clientes Identificados (42 únicos):**
```
Make Plant, Lerrux, Sant'Alberti, Dra. Karyne, Precisão, Tratto Agro, 
Hannover, GSA, Dazzie, Allgrotech - Agência, Oxen Currais, Aviarte, 
Dr. Lucas Sartori, Rei dos Pulverizadores, La Belle, Dra. Gabi Sartori, 
Dra. Maria Nazaré, Adpill, Dr. Flávio Zenun, Dona Raiz, Líder Rolamentos, 
Dácora, Otimiza, Dra Taísa Gauer, Verde Verduras, Agromoto, Aphase, 
Clientes [Daniel], Gian Tullio, VetAgro, Flávio Corá, Cria Fértil, 
Duro PVC, VetSell, Gusmão Lima, Narah Lopes, Profarm, Nutrifol, 
Clientes[Daniel], Conviê, Make Plant
```

**Estrutura Mínima por Cliente:**
```javascript
{
  orgId: 'dacora',
  displayName: clientName, // ÚNICO campo do Dacora
  
  // Campos obrigatórios com valores padrão
  email: '',
  phone: '',
  website: '',
  instagram: '',
  status: 'ATIVO',
  tier: 'MID_TIER',
  defaultAssigneeRef: null,
  entryDate: '2025-01-09', // Data atual
  responsible: '',
  paymentMethod: '',
  documents: '',
  notes: 'Cliente migrado do Dacora - dados mínimos',
  
  // Orçamentos zerados
  budgetMetaAds: 0,
  budgetGoogleAds: 0,
  budgetTikTokAds: 0,
  budgetPinterestAds: 0,
  
  // Plataformas inativas
  platformMetaAds: false,
  platformGoogleAds: false,
  platformTikTokAds: false,
  platformPinterestAds: false,
  
  // Performance zerada
  realBilling: 0,
  realLeads: 0,
  billingGoal: 0,
  leadsGoal: 0,
  roi: 0,
  
  // Controle de saldo vazio
  balanceControl: {
    metaAds: { lastDeposit: 0, depositDate: null, dailyBudget: 0 },
    googleAds: { lastDeposit: 0, depositDate: null, dailyBudget: 0 },
    tiktokAds: { lastDeposit: 0, depositDate: null, dailyBudget: 0 },
    pinterestAds: { lastDeposit: 0, depositDate: null, dailyBudget: 0 }
  },
  
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

---

### **ETAPA 4: Garantir Conformidade com Schema**

**Objetivo:** Validar que todos os campos importados estão de acordo com o schema v5.5

**Validações de Clientes:**
- ✅ Campo `displayName` obrigatório preenchido
- ✅ Status dentro dos valores: `ATIVO|INATIVO|PROSPECT`
- ✅ Tier dentro dos valores: `KEY_ACCOUNT|MID_TIER|LOW_TIER`
- ✅ Todos os campos numéricos são numbers válidos
- ✅ Todos os campos boolean são true/false
- ✅ Estrutura `balanceControl` completa
- ✅ Timestamps válidos em `createdAt` e `updatedAt`

**Validações de Tarefas:**
- ✅ Campos obrigatórios: `clientRef`, `title`, `assigneeRef`
- ✅ Status dentro dos valores: `não realizada|em progresso|concluída|cancelada`
- ✅ Priority dentro dos valores: `low|medium|high|urgent`
- ✅ Campo `hours` em formato decimal
- ✅ Referências `clientRef` apontam para clientes existentes
- ✅ Timestamps válidos

**Ferramenta de Validação:**
- Criar script que percorre todas as coleções
- Valida cada documento contra o schema
- Gera relatório de conformidade
- Identifica e corrige inconsistências

---

### **ETAPA 5: Garantir Correspondência Cliente-Tarefa**

**Objetivo:** Assegurar que todas as tarefas têm clientes correspondentes

**Validações:**
- ✅ Toda tarefa tem `clientRef` válida
- ✅ Todo `clientRef` aponta para cliente existente
- ✅ Nomes de clientes nas tarefas correspondem aos `displayName`
- ✅ Não há tarefas órfãs (sem cliente)
- ✅ Não há referências quebradas

**Correções Automáticas:**
- Criar clientes faltantes automaticamente
- Corrigir referências quebradas
- Padronizar nomes de clientes
- Remover duplicatas de clientes

**Relatório de Correspondência:**
```
✅ 42 clientes únicos identificados
✅ XXX tarefas com clientes válidos
⚠️ X tarefas com clientes não encontrados (criar automaticamente)
✅ 0 referências quebradas após correção
```

---

### **ETAPA 6: Confirmação Final**

**Objetivo:** Validar todo o processo antes da execução

**Checklist de Confirmação:**

**📊 Dados de Entrada:**
- ✅ Schema Taskora v5.5 documentado e validado
- ✅ Dados legados Dacora identificados e mapeados
- ✅ 42 clientes únicos extraídos das tarefas
- ✅ XXX tarefas identificadas para migração

**🏗️ Estrutura de Implementação:**
- ✅ Coleção `clients` com schema completo
- ✅ Coleção `tasks` com integração Team v5.5
- ✅ Mapeamento de campos Dacora → Taskora definido
- ✅ Valores padrão para campos ausentes definidos

**🔍 Validações:**
- ✅ Ferramenta de validação de schema criada
- ✅ Ferramenta de correspondência cliente-tarefa criada
- ✅ Relatórios de conformidade implementados
- ✅ Correções automáticas de inconsistências

**⚡ Execução:**
- ✅ Ordem de execução definida (schema → clientes → tarefas → validação)
- ✅ Rollback plan em caso de erro
- ✅ Backup dos dados originais
- ✅ Testes em ambiente de desenvolvimento

---

## 🚀 PRÓXIMOS PASSOS

1. **AGUARDAR CONFIRMAÇÃO** do usuário para prosseguir
2. **EXECUTAR ETAPA 1:** Implementar schema completo
3. **EXECUTAR ETAPA 2:** Importar tarefas legadas
4. **EXECUTAR ETAPA 3:** Importar nomes dos clientes
5. **EXECUTAR ETAPA 4:** Validar conformidade
6. **EXECUTAR ETAPA 5:** Verificar correspondências
7. **FINALIZAR:** Relatório final e validação completa

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

- **Dados Mínimos:** Clientes terão apenas nomes do Dacora, demais campos com valores padrão
- **Referências:** Todas as tarefas terão referências válidas para clientes
- **Schema v5.5:** Implementação completa com integração Team
- **Validação:** Cada etapa será validada antes de prosseguir
- **Rollback:** Possibilidade de reverter em caso de problemas

**Status:** ⏳ AGUARDANDO CONFIRMAÇÃO PARA EXECUÇÃO
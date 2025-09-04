# 📖 READMEFIRST - Orientações Iniciais  
**Versão do app:** `dácora_v6.1.0_redesign_login.html`

Este documento deve ser lido **antes de qualquer modificação no app Dácora**.  
Ele garante que todo novo colaborador ou chat siga corretamente o fluxo de trabalho, evitando retrabalho, inconsistências e perda de tempo.

---

## 📌 Objetivo
- O **Taskora** é a base tecnológica usada pela **Dácora** em **white label**.  
- **UI e branding são Dácora**, com a assinatura **"powered by Taskora"** (não alterar).  
- Esta versão do app é **Dácora v6.1.0 com Interface de Login Redesenhada**, identificada por: **`taskora_v5.5.5_secure_firebase.html`** + **Cloud Functions** + **Novo Design de Login**.  
- **Novidades v6.1.0:** Redesign completo da interface de login com novo branding Dácora
- **Mudança de Branding:** Interface de login agora exibe "Dácora - powered by Taskora"
- **Design Modernizado:** Interface limpa, responsiva e otimizada para todos os dispositivos
- **Sistema de Automações v6.0.0:** Sistema completo de automações Firebase com backup diário, lembretes automáticos e monitoramento 24/7
- **Etapa 2 Concluída:** Primeira automação 100% operacional com 4 Cloud Functions implantadas
- Firestore inicia em **modo Produção**, com **autenticação anônima habilitada** (sem tela de login).

## 🤖 Sistema de Automações (v6.0.0)

### **Cloud Functions Operacionais ✅**
- **backupDiario:** Backup automático às 2h da manhã (horário de Brasília)
- **lembretesAutomaticos:** Lembretes de tarefas às 9h da manhã
- **testarAutomacoes:** Função de teste manual das automações
- **statusAutomacoes:** Endpoint de monitoramento em tempo real

### **URLs Funcionais**
- **Status:** https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes
- **Teste:** https://southamerica-east1-dacora---tarefas.cloudfunctions.net/testarAutomacoes

### **Configurações de Email ✅**
- **Sistema:** equipe@nandacora.com.br
- **Admin:** flacora@gmail.com
- **Status:** 100% configurado e funcional

### **Benefícios Ativos**
- 🔒 **Segurança:** Backups automáticos diários
- 📧 **Produtividade:** Lembretes automáticos de tarefas
- 📊 **Monitoramento:** Sistema 24/7 com 183 tarefas monitoradas
- 💰 **Custo:** $0.11-$0.31/mês (extremamente baixo)

---

## 1) Primeira Regra: Seja um **Expert no App**
Antes de escrever qualquer linha de código:
- Ler o código do arquivo principal: `taskora_v5.5.5_secure_firebase.html`
- Ler os documentos atualizados em `docs/`:
  - `TASKORA_GUIDE.md`, `SCHEMA_TASKORA.md`, `FIRESTORE_RULES.md`, `INDEXES.md`, `CHANGELOG.md`.
- Entender layout, páginas, componentes JS/CSS e integração com Firebase:
  - **Config** em `assets/js/config/firebase-config.js` (carrega configuração segura do Firebase).  
  - **Bootstrap** em `assets/js/firebase.js` (inicializa `app/db`).
  - **Roteamento** em `assets/js/app.js` (router por hash).
- **Só após familiaridade completa** começar ajustes/melhorias.
- Não implementar sem entender o fluxo inteiro.

---

## 2) Estado Atual da Aplicação (v5.3)

### **Módulos Totalmente Implementados ✅**
- **Clientes** (`assets/js/pages/clients.js` + `assets/js/data/clientsRepo.js`)
  - CRUD completo, filtros avançados, exportação CSV/PDF
  - Sistema de orçamentos por plataforma, plataformas ativas
  - Modal de detalhes, criação/edição com validação
  
- **Tarefas** (`assets/js/pages/tasks.js` + `assets/js/data/tasksRepo.js`)
  - CRUD completo, sistema de filtros integrado
  - Sistema de horas corrigido (HH:MM ↔ decimal)
  - Integração com clientes via referências
  
- **Calendário** (`assets/js/pages/calendar.js`)
  - Grid perfeito 7x6 sem overflow
  - Sistema "Mostrar Mais" (2 tarefas por célula)
  - Edição inline, pills coloridas por status
  - Integração com filtros globais
  
- **Histórico** (`assets/js/pages/history.js`) **[NOVO v5.3]**
  - Seletor de cliente inteligente
  - Cards de estatísticas, timeline visual
  - Sistema de filtros avançado
  - Layout responsivo completo

### **Módulos Placeholder ⏳**
- **Insights** (`assets/js/pages/insights.js`) - "Em breve"
- **Team** (`assets/js/pages/team.js`) - "Em breve"
- **Ajustes** (`assets/js/pages/settings.js`) - "Preferências locais"

---

## 3) Banco de Dados (Taskora v5.3, implementação real)

### **Coleções Implementadas:**
- **`clients`**: Gestão completa com orçamentos por plataforma como campos diretos
- **`tasks`**: Sistema de horas em decimal, soft delete, referências validadas

### **Coleções NÃO Implementadas:**
- **`calendarEvents`**: Eventos derivados diretamente de `tasks`
- **`taskActivities`**: Histórico lê diretamente de `tasks`
- **`settingsOrg/settingsUser`**: Apenas placeholders
- **`insightsDaily`**: Apenas placeholder

### **Sistema de Horas Implementado:**
- **Entrada:** HH:MM (interface do usuário)
- **Armazenamento:** Campo `hours` em decimal (1.5 = 1h30min)
- **Exibição:** HH:MM (convertido de decimal)
- **Fallback:** Campos `estimatedMinutes`/`spentMinutes` para compatibilidade

### **Eventos em Tempo Real:**
- Sistema de CustomEvents implementado
- `taskora:clients:changed` e `taskora:tasks:changed`
- Atualizações automáticas entre módulos

---

## 4) Fluxo de Trabalho (disciplina de processo)
Sequência obrigatória: **análise do código → planejamento → validação → implementação → teste (console limpo) → ajustes finais**.

### **Antes de Implementar:**
- **Analisar código existente** nos repositórios (`clientsRepo.js`, `tasksRepo.js`)
- **Entender padrões** de mapeamento UI ↔ DB (`mapUiToDb`, `mapDbToUi`)
- **Verificar sistema de eventos** em tempo real
- **Validar com dados de teste** (modo anônimo)

### **Durante Implementação:**
- **Entregas completas** (arquivos inteiros; nunca trechos soltos)
- **Consistência visual**: manter cores, tipografia e espaçamento existentes
- **Paleta oficial**: Verde #014029, Terracota #993908, Off-white #F2EFEB
- **White label**: preservar "Dácora powered by Taskora"

### **Após Implementação:**
- **Console limpo** (sem erros JavaScript)
- **Testes funcionais** em todos os módulos afetados
- **Validação de eventos** em tempo real
- **Verificação de filtros** e integrações

---

## 5) Arquitetura e Componentes

### **Sistema de Roteamento:**
```javascript
// Router simples por hash em assets/js/app.js
const routes = {
  "#/tasks": window.TaskoraPages.tasks,
  "#/calendar": window.TaskoraPages.calendar,
  "#/clients": window.TaskoraPages.clients,
  "#/history": window.TaskoraPages.history,
  // ...
};
```

### **Sistema de Filtros:**
- **Filtros Globais** (`assets/js/components/layout/GlobalFiltersBar.js`)
- **Store de Filtros** (`assets/js/store/filtersStore.js`)
- **Ocultação inteligente** em páginas com filtros próprios (clientes, histórico)

### **Repositórios de Dados:**
- **Padrão consistente** entre `clientsRepo.js` e `tasksRepo.js`
- **Validação de referências** via `resolveClientRefByName()`, `resolveAssigneeRefByName()`
- **Mapeamento robusto** UI ↔ DB com fallbacks
- **Emissão de eventos** após operações CRUD

---

## 6) Segurança e Validação

### **Autenticação:**
- **Anônima habilitada** (sem tela de login)
- **Isolamento por `orgId`** em todas as consultas
- **Configuração** em `assets/js/config/firebase-test.js`

### **Validação de Dados:**
- **Campos obrigatórios** validados no código JavaScript
- **Referências cruzadas** validadas antes da gravação
- **Formato de horas** validado (HH:MM → decimal → HH:MM)
- **Status e enums** validados conforme constantes definidas

### **Proteção de Campos:**
- **Timestamps** gerenciados automaticamente
- **Referências** validadas via funções específicas
- **Soft delete** implementado via `deletedAt`

---

## 7) Documentação Atualizada (v5.3)
- `TASKORA_GUIDE.md`: módulos implementados e funcionalidades reais
- `SCHEMA_TASKORA.md`: campos e estruturas conforme código atual
- `FIRESTORE_RULES.md`: regras baseadas na implementação
- `INDEXES.md`: índices para consultas realmente implementadas
- `CHANGELOG.md`: histórico completo incluindo v5.3
- `READMEFIRST.md`: este documento atualizado

---

## 8) Validação de Melhorias

### **Antes de Implementar:**
- Novas funcionalidades devem ser validadas com **dados de teste** (modo anônimo)
- Verificar **compatibilidade** com sistema de eventos em tempo real
- Testar **integração** com filtros globais e locais

### **Após Implementar:**
- **Console limpo** obrigatório
- **Testes em todos os módulos** afetados
- **Validação de performance** nas consultas
- **Verificação de responsividade** em diferentes telas

### **Fluxos Validados:**
- ✅ **CRUD de clientes** com orçamentos e plataformas
- ✅ **CRUD de tarefas** com sistema de horas corrigido
- ✅ **Calendário** com grid perfeito e edição inline
- ✅ **Histórico** com timeline e filtros avançados
- ✅ **Filtros globais** com integração inteligente
- ✅ **Exportação** CSV/PDF de clientes
- ✅ **Eventos em tempo real** entre módulos

---

## 9) Estrutura de Arquivos Atual

```
taskora-app/
├── index.html (redirecionamento)
├── taskora_v5.3_history_module.html (arquivo principal)
├── assets/
│   ├── js/
│   │   ├── app.js (roteamento)
│   │   ├── firebase.js (bootstrap)
│   │   ├── config/firebase-test.js
│   │   ├── data/
│   │   │   ├── clientsRepo.js ✅
│   │   │   └── tasksRepo.js ✅
│   │   ├── pages/
│   │   │   ├── clients.js ✅
│   │   │   ├── tasks.js ✅
│   │   │   ├── calendar.js ✅
│   │   │   ├── history.js ✅ [v5.3]
│   │   │   ├── insights.js ⏳
│   │   │   ├── team.js ⏳
│   │   │   └── settings.js ⏳
│   │   ├── components/layout/
│   │   ├── store/filtersStore.js
│   │   ├── tools/ (utilitários)
│   │   └── utils/ (formatação)
│   └── css/ (estilos)
└── docs/ (documentação atualizada)
```

---

✅ Este documento é o **primeiro ponto de leitura** em cada novo chat.  
Garante consistência, reduz retrabalho e mantém a evolução alinhada ao estado real da aplicação v5.3 e ao fluxo de trabalho definido.

**Lembre-se:** A documentação agora reflete **exatamente** o que está implementado no código, não mais especulações ou planejamentos futuros.

# TASKORA_GUIDE.md

## 🚨 DIRETRIZES CRÍTICAS DE DESENVOLVIMENTO

### ⚠️ **REGRA FUNDAMENTAL - CONFIRMAÇÃO OBRIGATÓRIA**

**NUNCA INFORMAR AS MUDANÇAS FEITAS ANTES DA CONFIRMAÇÃO DO USUÁRIO QUE FORAM FEITAS DE VERDADE**

#### 📋 **FLUXO OBRIGATÓRIO:**
1. **Implementar mudanças** no código
2. **AGUARDAR confirmação** do usuário que testou
3. **SÓ ENTÃO** declarar sucesso ou conclusão
4. **NUNCA assumir** que funcionou sem teste real

#### ❌ **PROIBIDO:**
- Declarar "funcionando perfeitamente" sem confirmação
- Assumir que mudanças foram aplicadas com sucesso
- Celebrar implementações não testadas
- Marcar tarefas como concluídas sem validação

#### ✅ **CORRETO:**
- Implementar mudanças
- Pedir para o usuário testar
- Aguardar feedback real
- Só então confirmar sucesso

---

## 📌 Visão Geral

O **Taskora** é a base tecnológica do aplicativo utilizado pela **Dácora**.  
No front-end, a identidade visual **permanece 100% como Dácora**, com a assinatura **"powered by Taskora"**.  
Toda a evolução descrita aqui é **estrutural e técnica**, não alterando a UI ou branding.

**Versão atual:** `taskora_v5.5.9_insights_charts.html`  
**Arquivo principal:** `taskora_v5.5.5_secure_firebase.html` (com redirecionamento via `index.html`)  
**Última atualização:** v5.5.9 - 16/01/2025 (Gráficos Interativos + Melhorias Visuais)

O Taskora organiza informações em módulos principais:
- **Clientes** ✅ (Totalmente implementado)
- **Tarefas** ✅ (Totalmente implementado)  
- **Calendário** ✅ (Totalmente implementado)
- **Histórico** ✅ (Totalmente implementado - v5.3)
- **Insights** ✅ (Totalmente implementado - v5.5.9 com gráficos Chart.js)
- **Team** ⏳ (Placeholder - "Em breve")
- **Ajustes** ⏳ (Placeholder - "Preferências locais")

---

## 🔑 Arquitetura Atual

### **Firebase & Autenticação**
- **Firestore** em modo produção com autenticação anônima
- **Configuração:** `assets/js/config/firebase-test.js`
- **Bootstrap:** `assets/js/firebase.js`
- **Isolamento por `orgId`** com papéis: `viewer`, `member`, `admin`

### **Sistema de Roteamento**
- **Router simples por hash** em `assets/js/app.js`
- **Filtros globais** ocultados automaticamente em páginas com filtros próprios (clientes, histórico)
- **Layout responsivo** com sidebar, topbar e área de conteúdo

### **Sistema de Dados**
- **Repositórios:** `clientsRepo.js`, `tasksRepo.js`
- **Eventos em tempo real:** Sistema de eventos customizados para atualizações automáticas
- **Formato de tempo:** Minutos inteiros (armazenado) → HH:MM (exibido)

---

## 🧩 Módulos Implementados

### 1. **Clientes** ✅ COMPLETO
**Arquivo:** `assets/js/pages/clients.js`  
**Repositório:** `assets/js/data/clientsRepo.js`

#### **Funcionalidades Principais:**
- **CRUD completo** de clientes
- **Sistema de filtros avançado:** Status, Tier, Responsável, Orçamento
- **Busca inteligente:** Nome, email, responsável, website, Instagram
- **Cards de estatísticas:** Total clientes, Orçamento total, Key Accounts, Ativos
- **Exportação:** CSV e PDF com dados filtrados
- **Modal de detalhes** com links funcionais
- **Modal de criação/edição** com validação completa

#### **Campos Principais:**
- `displayName`, `email`, `phone`, `website`, `instagram`
- `status` (Ativo, Inativo, Prospect)
- `tier` (Key Account, Mid Tier, Low Tier)
- `defaultAssigneeRef` (responsável padrão)
- **Orçamentos por plataforma:** Meta Ads, Google Ads, TikTok, LinkedIn, etc.
- **Plataformas ativas:** Checkboxes para seleção múltipla

#### **Paleta de Cores:**
- **Verde corporativo:** #014029
- **Terracota:** #993908
- **Off-white:** #F2EFEB

---

### 2. **Tarefas** ✅ COMPLETO
**Arquivo:** `assets/js/pages/tasks.js`  
**Repositório:** `assets/js/data/tasksRepo.js`

#### **Funcionalidades Principais:**
- **CRUD completo** de tarefas
- **Sistema de filtros** integrado com filtros globais
- **Modal de criação/edição** com validação
- **Sistema de horas:** Entrada em HH:MM, armazenamento em minutos
- **Cards de estatísticas** com formatação correta
- **Integração com clientes** via referências

#### **Campos Principais:**
- `clientRef`, `title`, `description`, `status`, `assigneeRef`, `priority`
- `startAt`, `dueAt`, `reminderAt` (Timestamps)
- `estimatedMinutes`, `spentMinutes` (inteiros)
- **Status:** Não Realizada, Em Progresso, Concluída, Cancelada
- **Prioridade:** Low, Medium, High, Urgent

#### **Correções Implementadas:**
- **Sistema de horas corrigido:** Formato HH:MM consistente
- **Mapeamento robusto:** `mapUiToDb` e `mapDbToUi` com fallbacks
- **Compatibilidade:** Dados novos e legados

---

### 3. **Calendário** ✅ COMPLETO
**Arquivo:** `assets/js/pages/calendar.js`  
**Utilitários:** `assets/js/tools/calendar-fit.js`, `calendar-sizing-override.js`

#### **Funcionalidades Principais:**
- **Grid perfeito 7x6** sem overflow vertical/horizontal
- **Células com altura fixa** (125px) aproveitando 100% da viewport
- **Sistema "Mostrar Mais":** Máximo 2 tarefas por célula, resto em "+X mostrar mais"
- **Edição inline** no modal sem duplicação
- **Pills coloridas por status**
- **Integração com filtros globais**

#### **Melhorias Técnicas:**
- **Função `fitCalendarGrid`:** Cálculo preciso de altura
- **Sistema de ajuste fino:** RequestAnimationFrame para correções de 1-2px
- **Datas normalizadas:** Formato americano (MM/DD/YYYY) em todo o sistema
- **Responsividade mantida:** Breakpoints para diferentes tamanhos de tela

---

### 4. **Histórico** ✅ COMPLETO (v5.3)
**Arquivo:** `assets/js/pages/history.js`

#### **Funcionalidades Principais:**
- **Seletor de cliente inteligente:** "Todos os Clientes" + clientes individuais
- **Cards de estatísticas:** Total de tarefas, concluídas, horas trabalhadas, taxa de conclusão
- **Timeline visual:** Organização cronológica por mês com tarefas agrupadas
- **Sistema de filtros avançado:** Status, cliente, responsável, datas e filtros rápidos
- **Título dinâmico:** "Histórico de Tarefas - [Cliente] - [Período]" contextual
- **Layout responsivo:** Adaptação completa para desktop e mobile

#### **Interface e UX:**
- **Design consistente:** Paleta de cores alinhada com identidade Taskora
- **Timeline intuitiva:** Dots coloridos por status, informações organizadas
- **Filtros inteligentes:** Aplicação automática com feedback visual
- **Estados vazios:** Mensagens contextuais para orientar o usuário
- **Navegação integrada:** Acesso via modal de clientes e menu lateral

---

### 5. **Insights** ⏳ PLACEHOLDER
**Arquivo:** `assets/js/pages/insights.js`  
**Status:** Apenas placeholder com mensagem "Em breve"

### 6. **Team** ✅ IMPLEMENTADO (v5.5)
**Arquivo:** `assets/js/pages/team.js`  
**Status:** Módulo completo de gestão de equipe

**Funcionalidades implementadas:**
- **CRUD Completo:** Criar, editar, visualizar e excluir membros
- **Filtros Avançados:** Por especialidade, nível e status
- **Integração Tasks:** Responsáveis sincronizados com Tasks e Clientes
- **Validações:** Email único, campos obrigatórios
- **Interface Moderna:** Cards responsivos com estatísticas
- **Real-time:** Atualizações automáticas via Firebase

**Integração Team ↔ Tasks:**
- `metaRepo.js`: Função `listTeamMembers()` para buscar membros ativos
- Modal de Tasks: Select de responsáveis do Team
- Filtros de Clientes: Responsáveis do Team
- Fallback robusto para `listOwners()` se necessário

### 7. **Ajustes** ⏳ PLACEHOLDER
**Arquivo:** `assets/js/pages/settings.js`  
**Status:** Apenas placeholder com mensagem "Preferências locais do app aparecerão aqui"

---

## 🔧 Soluções Técnicas Importantes

### **Controle de Overflow em Containers Sticky**
**Problema:** Containers com `position: sticky` sendo "empurrados" agressivamente por conteúdo overflow

**Solução Testada e Aprovada:**
```css
.sticky-container {
  position: sticky;
  top: 40px; /* Buffer zone - CHAVE DO SUCESSO */
  z-index: 10;
  /* outros estilos... */
}
```

**Valores Testados:**
- `top: 0` - Problema original (muito grudado)
- `top: -20px` - Piorou (comportamento errático)
- `top: 20px` - Melhorou (mas ainda insuficiente)
- `top: 40px` - **PERFEITO** ✅

**Quando Aplicar:**
- Containers sticky que sofrem "empurrão" de tabelas/listas dinâmicas
- Situações onde sticky gruda demais no topo da viewport
- Overflow de conteúdo que causa movimento agressivo

**Princípio:** Buffer zone positivo resolve overflow agressivo em sticky containers

---

## ⚡ Sistemas de Apoio

### **Filtros Globais**
**Arquivo:** `assets/js/components/layout/GlobalFiltersBar.js`
- **Integração inteligente:** Oculto automaticamente em páginas com filtros próprios
- **Sincronização:** Publica eventos para `dateFrom/dateTo` e `startDate/endDate`
- **Quick Range:** Opções rápidas incluindo "Ontem"

### **Store de Filtros**
**Arquivo:** `assets/js/store/filtersStore.js`
- **Estado global:** Gerenciamento centralizado de filtros
- **Eventos:** Sistema de pub/sub para atualizações em tempo real

### **Utilitários**
- **Formatação de datas:** `assets/js/utils/dateFormat.js`
- **Refresh automático:** `assets/js/tools/tasks-live-refresh.js`
- **Verificação de consistência:** `assets/js/tools/consistencyCheck.js`

---

## 🎨 Design System

### **Paleta de Cores Oficial:**
- **Verde Dácora:** #014029 (títulos, elementos principais)
- **Terracota:** #993908 (acentos, hover states)
- **Off-white:** #F2EFEB (backgrounds suaves)

### **Tipografia:**
- **Fonte:** Red Hat Display (400, 500, 600, 700)
- **Títulos:** font-weight: 800, letter-spacing otimizado
- **Hierarquia visual:** Tamanhos consistentes (24px números, 10px labels)

### **Componentes:**
- **Cards compactos:** padding 18px 16px, gap 16px
- **Botões modernos:** border-radius 8px, text-transform uppercase
- **Animações suaves:** hover com translateY(-1px) e box-shadow
- **Modais centralizados:** z-index 9999, posicionamento perfeito

---

## 📅 Fluxo de Trabalho Atual

1. **Gestão de Clientes:**
   - Criar/editar cliente com responsável padrão
   - Definir orçamentos mensais por plataforma
   - Configurar plataformas ativas

2. **Gestão de Tarefas:**
   - Criar tarefas vinculadas a clientes
   - Herdar responsável padrão do cliente
   - Registrar tempo em formato HH:MM

3. **Visualização:**
   - Acompanhar no calendário com grid perfeito
   - Consultar histórico com timeline visual
   - Aplicar filtros avançados

4. **Exportação:**
   - Exportar dados de clientes em CSV/PDF
   - Relatórios com filtros aplicados

---

## ✅ Observação Final

- **UI e branding continuam da Dácora** com assinatura "powered by Taskora"
- **Módulos principais totalmente funcionais:** Clientes, Tarefas, Calendário, Histórico
- **Módulos em desenvolvimento:** Insights, Team, Ajustes (apenas placeholders)
- **Sistema robusto** com eventos em tempo real e filtros avançados
- **Design consistente** com paleta de cores e tipografia padronizadas
- **Performance otimizada** com grid perfeito e sistema de refresh inteligente

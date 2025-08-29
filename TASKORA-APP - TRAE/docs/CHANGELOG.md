# CHANGELOG.md

## 📌 Visão Geral
Este arquivo registra todas as mudanças significativas no aplicativo Taskora.  
A partir da base 2025-08-26, o Taskora deixa de depender do banco da Dácora e passa a ter **schema próprio**, embora a UI continue como **white label da Dácora powered by Taskora**.

## [v5.2] - 2025-01-20
### 🏢 Módulo de Clientes - Implementação Completa
**Novo módulo completo para gestão de clientes**

#### Arquitetura e Repositório de Dados
- **clientsRepo.js:** Repositório completo com CRUD, validações e eventos em tempo real
- **Schema Integrado:** Compatível com SCHEMA_TASKORA.md existente
- **Firebase Integration:** Mapeamento completo entre UI e banco de dados
- **Validações:** Campos obrigatórios e formatação adequada
- **Real-time Updates:** Sistema de eventos para atualizações automáticas

#### Interface da Página de Clientes
- **Design Consistente:** Seguindo identidade visual da marca (verde #014029 + terracota #993908)
- **Layout Responsivo:** Grid adaptável para desktop, tablet e mobile
- **Cabeçalho Padronizado:** Título "CLIENTES" seguindo padrão estabelecido
- **Cards de Estatísticas:** Total clientes, Orçamento total, Key Accounts, Ativos
- **Tabela Otimizada:** Colunas organizadas com informações essenciais

#### Sistema de Filtros Dedicado
- **Filtros Específicos:** Status, Tier, Responsável, Faixa de orçamento
- **Filtros Inteligentes:** Número de plataformas ativas, Presença digital
- **Busca Avançada:** Nome, email, responsável, website, Instagram
- **Filtro Global Removido:** Interface limpa sem redundâncias
- **Reset Completo:** Botão "Limpar" restaura todos os filtros

#### Modal de Detalhes Interativo
- **Nome Clicável:** Hover effect com cor da marca e tooltip
- **Visualização Completa:** Todas as informações organizadas em seções
- **Links Funcionais:** Website e Instagram abrem em nova aba
- **Design Elegante:** Grid responsivo com seções bem definidas
- **Botão Histórico:** Placeholder estruturado para futura integração

#### Modal de Criação/Edição Completo
- **Informações Básicas:** Nome*, Email, Telefone, Website, Instagram
- **Classificação:** Tier*, Status*, Data de Entrada, Responsável*
- **Orçamentos por Plataforma:** Meta Ads, Google Ads, TikTok, LinkedIn, YouTube, Pinterest, Twitter, Snapchat, Outras
- **Plataformas Ativas:** Checkboxes para seleção múltipla
- **Documentos e Notas:** Links de documentos e observações
- **Validação Completa:** Campos obrigatórios e feedback de erro

#### Funcionalidades de Exportação
- **Exportação CSV:** Todos os dados com filtros aplicados
- **Exportação PDF:** Relatório formatado para impressão
- **Botões no Cabeçalho:** Integrados com identidade visual
- **Dados Filtrados:** Exporta apenas resultados da busca atual

#### Melhorias de UX/UI
- **Modais Centralizados:** Z-index 9999 e posicionamento perfeito
- **Botões Padronizados:** Identidade visual consistente em toda aplicação
- **Animações Suaves:** Hover effects com elevação e sombras coloridas
- **Tipografia Elegante:** Uppercase, letter-spacing e hierarquia visual clara
- **Estados Vazios:** Indicação visual para campos não preenchidos

#### Arquivos Criados/Modificados
- ✅ **clientsRepo.js** - Repositório completo de dados
- ✅ **clients.js** - Página completa com todas as funcionalidades
- ✅ **app.js** - Remoção do filtro global na página de clientes

#### Resultado
✅ **Módulo 100% funcional** e pronto para produção  
✅ **Interface profissional** com design consistente  
✅ **Funcionalidades avançadas** de filtros e exportação  
✅ **Preparado para futuro** com estrutura para histórico de tarefas  

---

## [v5.3] - 2025-01-20
### 📊 Módulo de Histórico - Implementação Completa
**Novo módulo completo para visualização do histórico de tarefas por cliente**

#### Funcionalidades Implementadas
- **Seletor de Cliente Inteligente:** Opção "Todos os Clientes" + clientes individuais com fallback robusto
- **Cards de Estatísticas:** Total de tarefas, concluídas, horas trabalhadas e taxa de conclusão
- **Timeline Visual:** Organização cronológica por mês com tarefas agrupadas
- **Sistema de Filtros Avançado:** Status, cliente, responsável, datas e filtros rápidos
- **Título Dinâmico:** "Histórico de Tarefas - [Cliente] - [Período]" contextual
- **Layout Responsivo:** Adaptação completa para desktop e mobile

#### Interface e UX
- **Design Consistente:** Paleta de cores e tipografia alinhadas com a identidade Taskora
- **Timeline Intuitiva:** Dots coloridos por status, informações organizadas e descrições destacadas
- **Filtros Inteligentes:** Aplicação automática com feedback visual imediato
- **Estados Vazios:** Mensagens contextuais para orientar o usuário
- **Navegação Integrada:** Acesso via modal de clientes e menu lateral

#### Correção Crítica do Sistema de Horas
- **Problema Identificado:** Incompatibilidade entre formato decimal (página de tarefas) e sistema de leitura
- **Solução Implementada:** 
  - `mapUiToDb`: Prioriza campo `hours` decimal da página de tarefas
  - `mapDbToUi`: Lê campo `hours` diretamente do Firestore com fallback
  - Compatibilidade total com dados novos e legados
- **Resultado:** Horas trabalhadas exibidas corretamente em formato HH:MM

#### Arquivos Criados/Modificados
- ✅ **history.js** - Módulo completo de histórico com todas as funcionalidades
- ✅ **tasksRepo.js** - Correção do mapeamento de campos `hours` decimal
- ✅ **clients.js** - Integração do botão "Ver Histórico" no modal
- ✅ **app.js** - Roteamento e carregamento do módulo de histórico

#### Resultado
✅ **Módulo 100% funcional** com interface profissional  
✅ **Sistema de horas corrigido** e compatível  
✅ **Filtros avançados** com aplicação inteligente  
✅ **Timeline visual** organizada e responsiva  
✅ **Integração completa** com módulos existentes  
✅ **Preparado para futuro** com estrutura para exportação de relatórios  

---

## [v5.1] - 2025-01-20
### 🎨 Interface Redesign - Tasks Page Enhancement
**Melhorias na Página de Tarefas**

#### Redesign do Cabeçalho
- **Título "TASKS" Aprimorado:** Nova tipografia robusta (font-weight: 800) com letter-spacing otimizado
- **Cor da Marca:** Aplicada cor verde corporativa (#014029) para maior destaque
- **Separador Visual:** Adicionada borda inferior elegante para delimitar o cabeçalho
- **Alinhamento Refinado:** Melhor posicionamento do botão "Nova Tarefa" com align-items: flex-end

#### Cards de Estatísticas Otimizados
- **Tamanho Compacto:** Reduzido padding (18px 16px) e gap (16px) para melhor aproveitamento do espaço
- **Tipografia Balanceada:** Números em 24px e labels em 10px para hierarquia visual clara
- **Efeitos Interativos:** Hover com transform: translateY(-1px) e box-shadow suave
- **Sistema de Horas Corrigido:** Implementado formato HH:MM em vez de decimal

#### Melhorias no Botão "Nova Tarefa"
- **Design Moderno:** Estilo atualizado com border-radius: 8px e text-transform: uppercase
- **Animações Suaves:** Transições em background, transform e box-shadow
- **Feedback Visual:** Efeito hover com elevação e mudança de cor (#025a35)

#### Resultado
✅ **Interface mais harmoniosa** e profissional  
✅ **Cards compactos** sem perder legibilidade  
✅ **Horas formatadas corretamente** (HH:MM)  
✅ **Tipografia aprimorada** com hierarquia clara  
✅ **Interações visuais** mais fluidas  
✅ **Consistência visual** com a identidade da marca  

---

## [v5.0] - 2025-01-20
### 🎯 Calendar Perfect Grid - Versão Major
**Arquivo:** `taskora_v5.0_calendar_perfect_grid.html`

#### Melhorias Principais
- **Grid Perfeito:** Corrigido definitivamente o grid do calendário para exibir exatamente 7 colunas (dias da semana)
- **Dimensionamento Inteligente:** Sistema automático de dimensionamento que aproveita 100% da viewport sem criar scroll
- **Alinhamento Harmonioso:** Cabeçalho dos dias perfeitamente alinhado com as células do calendário
- **Espaçamentos Otimizados:** Gap de 8px consistente em todo o grid para melhor aproveitamento da tela
- **Edição Inline:** Implementada edição direta de tarefas no calendário sem necessidade de modal
- **Duplicação Corrigida:** Resolvido problema de duplicação de tarefas ao editar
- **Datas Americanas:** Normalização completa para formato americano (MM/DD/YYYY) em todo o sistema

#### Ajustes Visuais
- **Link "Mostrar Mais" Refinado:** Tamanho reduzido (10px, padding 1px 3px) para harmonia com as células
- **Altura das Células Equilibrada:** Ajustada para 125px, eliminando espaços em branco no rodapé
- **Responsividade Mantida:** Breakpoints preservados para diferentes tamanhos de tela

#### Melhorias Técnicas
- **Função `fitCalendarGrid` Otimizada:** Cálculo preciso de altura com margem de segurança (epsilon 25px)
- **Sistema de Ajuste Fino:** RequestAnimationFrame para correções de 1-2px de overflow/sobra
- **Altura Mínima Disponível:** Otimizada para 360px para melhor distribuição das células

#### Limpeza de Arquivos
- **Arquivos Removidos:** `taskora_local_test.html`, `taskora_sem_modulos.html`
- **Arquivo Renomeado:** `taskora_v4.3_calendar_gridOK_editbug.html` → `taskora_v5.0_calendar_perfect_grid.html`

#### Resultado
✅ **Grid 7x6 perfeito** sem distorções  
✅ **Zero scroll vertical** na página  
✅ **Aproveitamento total** da viewport  
✅ **Visual profissional** e harmonioso  
✅ **Performance otimizada** no redimensionamento  
✅ **Edição inline funcional** sem duplicações  
✅ **Datas padronizadas** em formato americano  
✅ **UX aprimorada** com interações diretas  

---

## [v4.3] - 2025-08-28
### Ajustes de Calendário e Grid
- Corrigido o layout das células do calendário, agora ocupando toda a área branca disponível sem criar rolagem vertical.
- Ajustado o padding das células para evitar efeito de "escamas de peixe".
- Garantido que o botão "mostrar mais" apareça corretamente quando houver mais de 2 tarefas em uma célula.
- Mantida a estabilidade das funcionalidades anteriores (filtros, edição e exclusão no modal).

### Versão nomeada
taskora_v4.3_calendar_gridOK_editbug


---
## [2025-08-28] — v4.2 `taskora_v4.2_grid_improve_editbug`
### Melhorias
- **Calendário (grid fixo sem overflow):** implementado ajuste automático de altura das linhas para manter o **mês inteiro visível** e respeitar o “Mostrar mais” quando há muitas tarefas no mesmo dia.
- **Consistência visual:** pílulas mantidas compactas; continua limitado a 2 pílulas antes de exibir “+X mostrar mais”.

### Correções
- **Duplicar tarefa no calendário:** normalizado o payload enviado ao Firestore (não envia `id` na criação), evitando erros de “Unsupported field value: undefined (id)”.

### Conhecidas (pendentes nesta versão)
1. **Data volta 1 dia** após qualquer edição no modal do calendário.  
   *Causa provável:* mistura de UTC vs horário local na serialização/parse das datas (`startAt/dueAt`) e no campo string `date (YYYY-MM-DD)`.
2. **Mover tarefa entre dias não reflete sem reload.**  
   *Causa provável:* o calendário não está invalidando o cache/estado após `updateTask`, então a UI não re-renderiza com o novo `date`.

### Plano para v4.3 (cirúrgico, sem quebrar o que já está funcionando)
- **Normalização de datas (local-first):**
  - Ao **ler** datas do Firestore: converter `Timestamp` para *Date local* e derivar `date` com `YYYY-MM-DD` **em fuso local**.
  - Ao **salvar/editar**: 
    - persistir `startAt`/`dueAt` como `Timestamp` (preservando hora local informada),
    - **regerar `date`** a partir de `startAt` em fuso local (sem UTC).
- **Refresh leve do calendário:**
  - Após `addTask/updateTask/deleteTask`, emitir um **evento local** (`calendar:refresh`) ou chamar a função que recompõe o grid do mês corrente para refletir a mudança sem reload da página.
- **Estabilidade do grid:**
  - Ajustar o **padding/gap vertical das células** para remover o espaço residual no final da página e manter um respiro entre as células.

> Nota: esta versão mantém a base v4.1 (filtros globais funcionando no calendário, pílulas coloridas por status, limite de 2 itens + “mostrar mais”) e adiciona o ajuste de grid. As duas correções de data/re-render entram na próxima entrega v4.3 para preservar a estabilidade do que já validamos hoje.

## [2025-08-27] — v4.1 `taskora_v4.1_calendarfilter_working`
### Correções

📌 Filtro de datas do calendário corrigido (inclusão de "Ontem" no quick range).

📌 Ajuste de layout para células fixas (sem overflow horizontal/vertical).

📌 Botão "Mostrar Mais" ajustado para limite de 2 tarefas antes de expandir.

📌 Pílulas coloridas por status.

📌 Próximas tarefas já planejadas: modal com ações, click direto em tarefas, reset automático de filtros na inicialização.

- **Calendário respeita intervalo de datas do Filtro Global.**  
  - A **GlobalFiltersBar** passou a publicar **ambos** os pares de datas ao aplicar filtros:
    - `dateFrom`/`dateTo` **e** `startDate`/`endDate`.  
  - Consumidores (Calendário, Tarefas, exportações) agora obtêm o **mesmo intervalo efetivo**, evitando divergências.
- **Quick Range:** restaurada a opção **“Ontem”**.
- **Exportações (CSV/PDF):** normalização de leitura do intervalo (aceita `dateFrom/dateTo` **ou** `startDate/endDate`).

### Notas de implementação
- Mudança **cirúrgica** focada na **GlobalFiltersBar**; nenhuma alteração estrutural no layout ou nas páginas.  
- Mantidos nomes e contratos atuais do app; solução não quebra módulos existentes.

### Itens pendentes (próximas entregas)
1. **Calendário — limites fixos de célula** para evitar estouro vertical/horizontal (mantendo o mês inteiro visível).
2. **Pills coloridas por status** no calendário (paleta consistente com Dácora).
3. **Reset dos filtros globais ao sair/retornar ao app** (definir política: limpar em `unload`/`visibilitychange` ou no boot).

---

## [2025-08-26] — Nova Base Taskora
- **Banco independente:** criado schema próprio (`SCHEMA_TASKORA.md`), fim da compatibilidade obrigatória com a Dácora.  
- **Clientes:**  
  - Adicionado campo `defaultAssigneeRef` (responsável padrão).  
  - Criada subcoleção `budgets` para registrar orçamentos mensais por plataforma (Meta Ads, Google Ads, TikTok etc.).  
- **Tarefas:**  
  - Campos de tempo agora armazenados em **minutos inteiros** (`estimatedMinutes`, `spentMinutes`), exibidos no formato **HH:MM**.  
  - `assigneeRef` obrigatório (se não informado, herda do cliente).  
  - Suporte a soft delete (`deletedAt`).  
- **Calendário:**  
  - Criada coleção `calendarEvents`.  
  - Suporte a eventos manuais e vinculados a tarefas (`source: TASK|MANUAL`).  
- **Histórico:**  
  - Criada coleção `taskActivities` (auditoria de mudanças em tarefas).  
- **Configurações:**  
  - Criadas `settingsOrg` (ajustes da organização) e `settingsUser` (preferências individuais).  
- **Insights:**  
  - Definida coleção `insightsDaily` para agregações diárias.  
- **Segurança:**  
  - Regras atualizadas com isolamento por `orgId`.  
  - Papéis (`viewer`, `member`, `admin`) com permissões distintas.  
  - Validações reforçadas em campos (`tags.length <= 20`, `amountBRL >= 0`, tempos ≥ 0).  
- **Índices:**  
  - Definidos novos índices para tarefas, calendário, clientes e histórico (`INDEXES.md`).

---

## [2025-07-XX] — Estado Anterior (legado)
- Banco dependente da Dácora.  
- Campos e coleções compatíveis com o schema legado (`SCHEMA_DACORA.md`).  
- Tarefas armazenavam tempo em horas decimais (ex.: 0,1h).  
- Não havia histórico detalhado (`taskActivities`).  
- Não havia budgets por cliente.  
- Regras de segurança menos restritivas.

---

## 📅 Próximos Passos Planejados
- Evoluir módulo **Insights** com relatórios avançados.  
- Criar métricas de **orçamento vs. gasto real** por cliente/plataforma.  
- Implementar suporte a **tarefas recorrentes**.  
- Explorar **notificações externas** (email/push).

---

## ✅ Observação Final
- Esta linha do tempo marca a transição para o **Taskora independente**, mantendo **UI e branding da Dácora**.  
- Documentos legados permanecem em `docs/legado/` para referência histórica.  
- Documentos ativos:  
  - `TASKORA_GUIDE.md`  
  - `SCHEMA_TASKORA.md`  
  - `FIRESTORE_RULES.md`  
  - `INDEXES.md`  
  - `CHANGELOG.md`

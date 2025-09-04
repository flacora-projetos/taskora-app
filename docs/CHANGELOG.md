# CHANGELOG.md

## 📌 Visão Geral
Este arquivo registra todas as mudanças significativas no aplicativo Taskora.  
A partir da base 2025-08-26, o Taskora deixa de depender do banco da Dácora e passa a ter **schema próprio**, embora a UI continue como **white label da Dácora powered by Taskora**.

## [v6.0.0] - 2025-09-03

### 🚀 ETAPA 2: PRIMEIRA AUTOMAÇÃO - IMPLEMENTAÇÃO COMPLETA
**Sistema de Automações Firebase com Cloud Functions**

#### 🏗️ Infraestrutura de Automação
- **Firebase Functions:** Implementação completa de 4 Cloud Functions na região `southamerica-east1`
  - 🔄 **backupDiario:** Backup automático diário às 2h da manhã
  - 📧 **lembretesAutomaticos:** Sistema de lembretes às 9h da manhã
  - 🧪 **testarAutomacoes:** Função de teste manual das automações
  - 📊 **statusAutomacoes:** Endpoint de monitoramento em tempo real
- **Cloud Scheduler:** Configuração de triggers automáticos com timezone America/Sao_Paulo
- **Cloud Storage:** Bucket configurado para armazenamento de backups com retenção de 2 dias
- **Nodemailer:** Sistema de envio de emails integrado com Gmail/Google Workspace

#### 💾 Sistema de Backup Automático
- **Backup Diário Completo:** Execução automática às 2h da manhã (horário de Brasília)
  - 📁 **Coleções Incluídas:** `tasks`, `clients`, `team`, `calendarEvents`, `taskActivities`
  - 🗜️ **Formato JSON:** Backup estruturado com timestamp e metadados
  - ☁️ **Cloud Storage:** Armazenamento seguro no bucket `dacora---tarefas.appspot.com`
  - 📧 **Notificação Email:** Confirmação automática enviada para o administrador
  - 🔄 **Retenção Inteligente:** Limpeza automática de backups com mais de 2 dias

#### 📬 Sistema de Lembretes Automáticos
- **Lembretes Diários:** Execução automática às 9h da manhã (horário de Brasília)
  - ⏰ **Tarefas Vencendo:** Detecção de tarefas que vencem nas próximas 24h
  - 🚨 **Tarefas Atrasadas:** Identificação de tarefas com prazo vencido
  - 📊 **Relatório Detalhado:** Email com lista completa e estatísticas
  - 🎯 **Filtros Inteligentes:** Exclusão de tarefas concluídas ou canceladas
  - 📧 **Email Formatado:** Template HTML profissional com cores da marca

#### 🔧 Configuração de Email
- **Variáveis de Ambiente:** Configuração completa no Firebase Functions
  - 📧 **email.user:** `equipe@nandacora.com.br` (remetente do sistema)
  - 🔐 **email.pass:** Senha de aplicativo do Google Workspace configurada
  - 👤 **admin.email:** `flacora@gmail.com` (destinatário das notificações)
- **Autenticação Segura:** Integração com Google Workspace usando senha de aplicativo
- **SMTP Gmail:** Configuração otimizada para envio confiável

#### 📊 Sistema de Monitoramento
- **Endpoint de Status:** URL pública para verificação em tempo real
  - 🌐 **URL:** `https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes`
  - 📈 **Métricas:** Último backup, tarefas pendentes, timestamp, versão
  - ✅ **Health Check:** Verificação de funcionamento das automações
- **Função de Teste:** Endpoint para teste manual das funcionalidades
  - 🧪 **URL:** `https://southamerica-east1-dacora---tarefas.cloudfunctions.net/testarAutomacoes`
  - 🔍 **Validação:** Teste de conectividade, email e backup

#### 📁 Arquivos Criados/Configurados
- ✅ **firebase.json** - Configuração do projeto Firebase
- ✅ **.firebaserc** - Configuração do projeto `dacora---tarefas`
- ✅ **functions/index.js** - Implementação completa das Cloud Functions
- ✅ **functions/package.json** - Dependências e scripts de deploy
- ✅ **functions/.eslintrc.js** - Configuração de linting
- ✅ **functions/README.md** - Documentação técnica das functions
- ✅ **CONFIGURACAO_EMAIL_FINAL.md** - Guia completo de configuração de email

#### 💰 Otimização de Custos
- **Custo Mensal Estimado:** $0.11 - $0.31 (extremamente baixo)
  - 🔄 **Cloud Functions:** ~$0.05/mês (60 execuções/mês)
  - ☁️ **Cloud Storage:** ~$0.02/mês (backups com retenção de 2 dias)
  - 📧 **Email:** Gratuito (Gmail/Google Workspace)
  - 📊 **Cloud Scheduler:** ~$0.04/mês (2 jobs)
- **Retenção Otimizada:** Armazenamento de imagens Docker por apenas 2 dias
- **Região Otimizada:** `southamerica-east1` para menor latência no Brasil

#### 🔒 Segurança e Confiabilidade
- **Backup Automático:** Proteção diária contra perda de dados
- **Monitoramento 24/7:** Sistema sempre ativo e monitorado
- **Logs Detalhados:** Rastreamento completo de todas as operações
- **Retry Logic:** Sistema de retry para garantir execução das tarefas
- **Validações:** Verificação de integridade antes de cada operação

#### 📈 Resultados Alcançados
- ✅ **Sistema 100% Operacional:** Todas as automações funcionando perfeitamente
- ✅ **183 Tarefas Monitoradas:** Sistema detectando e processando tarefas ativas
- ✅ **Deploy Bem-sucedido:** Cloud Functions implantadas e testadas
- ✅ **Email Configurado:** Sistema de notificações totalmente funcional
- ✅ **Monitoramento Ativo:** Endpoints de status e teste operacionais

#### 🎯 Benefícios Implementados
- **Segurança:** Backups automáticos diários garantem proteção dos dados
- **Produtividade:** Lembretes automáticos evitam atrasos em tarefas importantes
- **Confiabilidade:** Sistema funciona 24/7 sem intervenção manual
- **Visibilidade:** Monitoramento em tempo real do status das automações
- **Escalabilidade:** Infraestrutura preparada para futuras expansões

#### 🚀 Próximos Passos
Com a **Etapa 2** 100% concluída, o sistema está pronto para a **Etapa 3: Automação Inteligente**, que incluirá:
- Lembretes personalizados por usuário
- Filtros avançados de notificação
- Análise inteligente de padrões de tarefas
- Relatórios automatizados de performance
- Integração com ferramentas externas

---

## [v5.5.7] - 2025-01-31

### 🔧 CORRIGIDO
- **Dropdown de Status de Tarefas:** Correção do posicionamento quando tarefa está no fim da lista
  - 🎯 **Posicionamento Dinâmico:** Implementação de lógica para detectar espaço disponível na viewport
  - ⬆️ **Posicionamento Acima:** Dropdown aparece acima da "pill" quando não há espaço embaixo
  - ↔️ **Ajuste Horizontal:** Correção automática quando dropdown sai da lateral da tela
  - 📁 **Arquivo:** `tasks.js` - função `showStatusDropdown` com cálculo de posicionamento inteligente

- **Filtros Globais de Tarefas:** Correção da atualização instantânea após mudança de status
  - 🔄 **Re-filtragem Automática:** Substituição de `renderTableSlice()` por `fetchAndFilter(TaskoraFilters.get())`
  - 📊 **Atualização de Estatísticas:** Adição de `updateStats()` para refletir mudanças imediatamente
  - ⚡ **Resposta Instantânea:** Tarefas agora desaparecem/aparecem instantaneamente ao mudar status
  - 📁 **Arquivo:** `tasks.js` - função `showStatusDropdown` com aplicação correta dos filtros

- **Filtro de Intervalo Rápido:** Correção do filtro "Últimos 30 dias" que não funcionava no carregamento inicial
  - 🗓️ **Inicialização de Datas:** Processamento automático do filtro rápido quando datas estão vazias
  - 🔧 **Função setFromState:** Adição de lógica para aplicar datas do filtro rápido na inicialização
  - 💾 **Sincronização:** Atualização automática do `TaskoraFilters` com as datas calculadas
  - 📁 **Arquivo:** `GlobalFiltersBar.js` - função `setFromState` com processamento de filtros rápidos

### ✅ MELHORADO
- **Experiência do Usuário:** Interface mais responsiva e intuitiva
  - 🎨 **UI Consistente:** Dropdowns sempre visíveis independente da posição na tela
  - ⚡ **Performance:** Filtros aplicados instantaneamente sem necessidade de recarregamento
  - 🎯 **Precisão:** Filtros de data funcionam corretamente desde o primeiro carregamento

## [v5.5.6] - 2025-01-31

### 🔧 CORRIGIDO
- **Correção Massiva de Dados de Horas:** Implementação de ferramentas avançadas para correção de problemas de migração
  - ⏰ **Campo Hours:** Correção de 41 documentos com `hours` como `object null` → convertido para timestamp
  - 📅 **Campo DueDate:** Correção de 47 documentos com `dueDate` mal formatado (string → timestamp)
  - 🔄 **Campos de Recorrência:** Correção de 44 documentos com problemas:
    - `recurrenceDays` como `array null` → convertido para string "none"
    - `recurrenceUntil` como `string null` → convertido para string vazia
  - 🛠️ **Função fixLegacyHours:** Completamente reescrita para lidar com problemas específicos de migração
  - 🔧 **Função normalizeAllTypes:** Melhorada com correções específicas para tipos de dados incorretos
  - 📊 **Logs Detalhados:** Implementação de logging específico para cada tipo de correção aplicada

### ✅ ADICIONADO
- **Ferramenta de Limpeza Profunda Aprimorada:** `deep-data-cleanup.html` com funcionalidades expandidas
  - 🎯 **Correções Específicas:** Algoritmos dedicados para cada tipo de problema identificado
  - 📈 **Relatórios Detalhados:** Contadores específicos para cada categoria de correção
  - 🔍 **Validação Inteligente:** Verificação de integridade após cada operação de correção
  - ⚡ **Performance Otimizada:** Processamento em lotes para grandes volumes de dados

### 🗑️ REMOVIDO
- **Ferramentas Obsoletas:** Remoção de ferramentas que não funcionaram adequadamente:
  - `fix-legacy-hours.html` (funcionalidade migrada para deep-data-cleanup.html)
  - `fix-decimal-hours.html` (integrada na ferramenta principal)
  - Outras ferramentas redundantes de correção de dados

### 📚 DOCUMENTADO
- **Problemas de Migração:** Documentação completa dos problemas encontrados e soluções aplicadas
- **Ferramentas de Correção:** Guia de uso das ferramentas de limpeza de dados
- **Validação de Integridade:** Procedimentos para verificação pós-correção

## [v5.5.5] - 2025-01-31

### 🔧 CORRIGIDO
- **Status de Tarefas "Não Realizadas":** Correção das "bolinhas" de status que não ficavam vermelhas
  - 🔴 **Classe CSS Adicionada:** `.hs-task-dot.not-done` com cor vermelha (#EF4444)
  - 🔧 **Lógica Atualizada:** Condição para aplicar classe `not-done` quando status for "não realizada"
  - 📍 **Arquivo:** `history.js` - linhas de CSS e lógica das bolinhas de status
- **Botões de Exportação na Página de Tarefas:** Correção dos botões CSV e PDF que não funcionavam
  - 🔗 **Event Listeners:** Adicionados event listeners para `#exportCsvBtn` e `#exportPdfBtn`
  - 🌐 **Exposição Global:** Funções `exportCSV` e `exportPDF` expostas via `window.TaskoraExport`
  - 📁 **Arquivos:** `GlobalFiltersBar.js` (exposição global) e `tasks.js` (event listeners)
- **Exportação PDF de Tarefas:** Correção da funcionalidade que não abria janela de impressão
  - 🪟 **Window.open:** Parâmetros alterados de `"noopener,noreferrer"` para `'width=800,height=600'`
  - ⏱️ **Timeout:** Ajustado de 300ms para 500ms para consistência com página de clientes
  - 💬 **Mensagem:** Atualizada para "Verifique se pop-ups estão habilitados"
  - 📄 **Arquivo:** `GlobalFiltersBar.js` - função `exportPDF`

### 📚 DOCUMENTADO
- **Correções de Status:** Documentação da solução para bolinhas de status vermelhas
- **Exportação:** Documentação das correções nos botões de exportação CSV/PDF
- **Consistência:** Alinhamento da funcionalidade PDF entre páginas de tarefas e clientes

## [v5.5.4] - 2025-01-31

### 🔧 CORRIGIDO
- **Lógica de Controle de Saldo:** Atualização dos critérios de status das flags de saldo
  - 🟢 **Status OK:** Saldo ≥ R$ 15,00 (anteriormente baseado em dias de orçamento)
  - 🟡 **Status Baixo:** Saldo < R$ 15,00 e > R$ 0,00
  - 🔴 **Status Esgotado:** Saldo ≤ R$ 0,00 (mantido)
- **Consistência Visual:** Aplicação dos novos critérios em todas as interfaces (tabela, modal de detalhes, atualização em tempo real)
- **Tooltips Atualizados:** Mensagens explicativas das flags ajustadas para refletir os novos valores

### 📚 DOCUMENTADO
- **Schema Atualizado:** Documentação dos novos critérios de status de saldo em SCHEMA_TASKORA.md

## [v5.5.3] - 2025-01-31

### ✅ ADICIONADO
- **Campo Forma de Pagamento:** Novo campo para identificar método de pagamento do cliente (Boleto, PIX, Cartão de Crédito)
- **Lógica de Saldo Inteligente:** Clientes com Cartão de Crédito não exibem flags de controle de saldo
- **Interface Atualizada:** Campo Forma de Pagamento adicionado nos modais de edição e detalhes do cliente
- **Constantes PAYMENT_METHODS:** Implementação de constantes para padronização dos métodos de pagamento
- **Mapeamento de Dados:** Integração completa UI ↔ Database para o campo paymentMethod
- **Valor Padrão:** Boleto definido como forma de pagamento padrão para novos clientes

### 🔧 CORRIGIDO
- **Controle de Saldo:** Otimização da lógica para ignorar validações desnecessárias em pagamentos via cartão
- **Experiência do Usuário:** Melhoria na organização dos campos no modal de cliente

### 📚 DOCUMENTADO
- **Schema Atualizado:** Documentação do campo paymentMethod em SCHEMA_TASKORA.md
- **Constantes:** Adição das constantes PAYMENT_METHODS na documentação oficial

## [v5.5.2] - 2025-01-31

### ✅ ADICIONADO
- **Campos de Performance:** Novos campos "Faturamento Real" e "Número Real de Leads" na seção Metas & Performance
- **Cálculo Automático de ROI:** Implementação da fórmula ROI = Receita ÷ Despesa (Faturamento Real ÷ Soma dos Orçamentos das Plataformas)
- **Controle de Saldo Avançado:** Sistema completo de controle de saldo por plataforma (Meta Ads, Google Ads, TikTok Ads, Pinterest Ads)
- **Saldo Estimado Automático:** Cálculo em tempo real baseado em depósito, data e orçamento diário
- **Status Visual de Saldo:** Indicadores automáticos (🟢 OK, 🟡 Baixo, 🔴 Esgotado) baseados no saldo estimado
- **Atualização em Tempo Real:** ROI e saldos recalculados automaticamente ao alterar valores
- **Validação de Dados:** ROI retorna 0 quando faturamento ou despesa total for zero
- **Precisão Decimal:** ROI exibido com 2 casas decimais para maior precisão
- **Persistência Firebase:** Todos os campos de performance e controle de saldo salvos automaticamente no Firestore
- **Interface Responsiva:** Layout reorganizado para acomodar novos campos mantendo usabilidade

### 🔧 CORRIGIDO
- **Fórmula ROI:** Correção da lógica de cálculo para usar orçamentos das plataformas como despesa
- **Sincronização de Dados:** Garantia de atualização em tempo real entre interface e banco de dados
- **Validação de Campos:** Tratamento adequado de valores nulos e zero nos cálculos

### 📚 DOCUMENTADO
- **Schema Atualizado:** Documentação dos novos campos de performance em SCHEMA_TASKORA.md
- **Lógica de Cálculo:** Documentação detalhada da fórmula e comportamento do ROI automático
- **Changelog:** Registro completo das funcionalidades implementadas

## [v5.5.1] - 2025-01-30

### ✅ ADICIONADO
- **Team Integration Completa:** Integração total entre módulos Team e Tasks
- **Trigger Automático:** Atualização automática de horas no Firebase Team ao criar/editar tarefas
- **Retry Mechanism:** Sistema de retry inteligente para garantir sincronização
- **Sticky Headers:** Implementação de cabeçalhos fixos com buffer zone (40px)
- **Título Team:** Adicionado título "TEAM DÁCORA" na página Team
- **Pílulas de Nível:** Corrigidas pílulas para todos os níveis (Sênior, Diretor, etc.)
- **Campo Horas:** Implementação de cálculo automático de horas trabalhadas por membro
- **Select de Membros:** Substituição de input texto por select no modal de tarefas
- **Validações:** Garantia de responsável válido nas tarefas

### 🔧 CORRIGIDO
- **Overflow Sticky:** Solução para containers sticky com buffer zone positivo
- **Acentos em Níveis:** Normalização de acentos para classes CSS
- **Timing de Carregamento:** Correção de problemas de timing entre módulos
- **Persistência de Dados:** Garantia de salvamento no Firebase
- **Interface Responsiva:** Melhorias em espaçamentos e layouts

### 🗑️ REMOVIDO
- **Tema Escuro:** Remoção completa do sistema de tema escuro
- **Arquivos Órfãos:** Limpeza de referências e comentários desnecessários

### 📚 DOCUMENTADO
- **Soluções Técnicas:** Documentação de buffer zone em TASKORA_GUIDE.md
- **Padrões:** Estabelecimento de padrões para sticky containers

## [v5.5] - 2025-01-21
### 🔗 Integração Team ↔ Tasks + Navegação de Calendário
**Integração completa entre módulos Team e Tasks com navegação aprimorada no calendário**

#### Integração Team ↔ Tasks
- **metaRepo.js:** Nova função `listTeamMembers()` para buscar membros ativos do Team
- **Modal de Tarefas:** Campo responsável transformado de input texto para select com membros do Team
- **Filtros de Clientes:** Filtro de responsável agora usa dados do Team em tempo real
- **Modal de Clientes:** Campo responsável com select de membros do Team
- **Fallback Robusto:** Sistema de fallback para `listOwners()` se Team não estiver disponível
- **Logs Informativos:** Console logs para debug e monitoramento da integração

#### Navegação de Calendário
- **Seletores Mês/Ano:** Novos seletores no cabeçalho do calendário para navegação rápida
- **Design Consistente:** Seletores seguem padrão visual dos filtros existentes
- **Posicionamento:** Título "CALENDÁRIO" à esquerda, seletores à direita
- **Funcionalidade:** Navegação instantânea entre meses e anos (±5 anos do atual)
- **Integração:** Mantém compatibilidade com filtros globais existentes
- **Layout Otimizado:** Espaçamento ajustado para não cortar última linha do calendário

#### Correções e Melhorias
- **Funções Assíncronas:** Correção de erros TypeScript com await em funções não-async
- **Alinhamento Visual:** Ajuste fino no posicionamento dos seletores para melhor alinhamento
- **Backup Automático:** Sistema de backup antes de modificações críticas
- **Validações:** Remoção de validação de `hourlyRate` em `teamRepo.js`
- **Imports Corrigidos:** Padronização de caminhos de importação do Firebase

#### Ferramentas de Migração
- **migrate-calendar-to-tasks.html:** Script para migrar dados de calendarEvents → tasks
- **cleanup-legacy-collections.html:** Ferramenta segura para limpeza de coleções legadas
- **populate-team.html:** Script para popular coleção Team com dados de exemplo

#### Especificações Técnicas
- **Seletores:** Padding 8px 12px, border #D1D5DB, border-radius 8px
- **Focus State:** Border #014029 com box-shadow rgba(1,64,41,0.1)
- **Responsividade:** Layout adaptável mantido em todas as telas
- **Performance:** Renderização otimizada com funções assíncronas

## [v5.4] - 2025-01-21
### 🎯 Módulo de Tarefas - Cabeçalho Congelado
**Implementação de cabeçalho sticky para melhor UX**

#### Interface Aprimorada
- **Cabeçalho Congelado:** Cabeçalho da tabela sempre visível na área sticky
- **Alinhamento Perfeito:** Colunas do cabeçalho perfeitamente alinhadas com dados
- **Estrutura Otimizada:** Thead invisível mantém larguras fixas das colunas
- **Estilo Padronizado:** Visual idêntico ao módulo de clientes
- **Responsividade:** Colunas se ocultam adequadamente em telas menores

#### Melhorias Técnicas
- **Performance:** Thead invisível preserva estrutura sem impacto visual
- **Consistência:** Mesmo padrão de cores e tipografia dos clientes
- **UX Otimizada:** Referência constante das colunas durante scroll
- **Alinhamento Centralizado:** Colunas TAREFA, INÍCIO, LIMITE, HORAS e AÇÕES centralizadas
- **Padrão Estabelecido:** Estrutura definida para futuros módulos

#### Especificações Visuais
- **Container:** Background #FFFFFF, border 1px #E4E7E4, border-radius 8px
- **Células:** Background #F8F9FA, font-weight 900, font-size 12px
- **Tipografia:** Color #334155, letter-spacing 0.2px, padding 12px 10px
- **Sombra:** Box-shadow 0 2px 4px rgba(0,0,0,0.1)

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

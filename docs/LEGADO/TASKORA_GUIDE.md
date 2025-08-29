# Taskora – Guia de Trabalho, Padrões de Entrega e Roadmap Operacional

> Documento de referência para qualquer novo chat/trabalho sobre o app **Taskora** (Dácora).
> Escopo: consolidar o que já foi feito/validado, o que falta (não validado), como evoluir sem quebrar nada e quais padrões seguir.

---

## 1) Estado Atual – **Implementado e Validado**

### 1.1. UI/UX
- **Layout**: paleta, tipografia e estilos harmonizados com o app; chips de **Status** e **Cliente** com estética consistente.
- **Página Tasks**
  - Botão **“Nova Tarefa”** (no topo à direita). Hover/active OK.
  - Tabela com colunas: **Status**, **Cliente**, **Tarefa**, **Responsável**, **Início**, **Limite**, **Horas**.
  - **Paginação visual** por “Carregar mais” (quando aplicável).
- **Modal “Adicionar Nova Tarefa”**
  - Campos: Cliente*, Responsável*, Descrição*, Status (default **“não realizada”**), Horas (opcional), Início*, Limite*, Término (opcional), Recorrência.
  - Recorrência: `none | daily | weekdays (seg–sex) | weekly | monthly | weekly-one (dia específico)`.
  - **Toast central** (“Tarefa criada com sucesso”) após salvar.
  - **Sem** copy sobre fuso horário (removida).

### 1.2. Dados, Normalização e Formatos
- **Status oficiais** no app: `iniciada`, `em progresso`, `concluída`, `não realizada`.
- **Normalização ABERTA → iniciada** (e variações: “a fazer”, “todo”, “open”, “pendente”, etc.).
- Datas em **formato local (Brasil)** – uso de strings ISO locais `YYYY-MM-DD` (equivalente a UTC-3 na apresentação).
- **Recorrência** no payload simulado:
  - `recurrence.type` e, quando aplicável, `recurrence.days` (ex.: `weekdays` → `[1,2,3,4,5]`; `weekly-one` → um dia `[1..5]`).
  - Campos complementares para compatibilidade com Dácora: `recurrenceType`, `recurrenceDays`, `recurrenceUntil`.

### 1.3. Integrações e Fontes
- **Leitura de Tasks (Firestore)**:
  - Tenta `orderBy(createdAt, desc)` com fallback defensivo para listagem simples quando índice/campo indisponível.
- **Metadados (clientes/owners)**: usados no modal (via `metaRepo`) para preencher selects.

### 1.4. Comportamento de Filtros (atual)
- É possível filtrar por **Status / Cliente / Responsável / Período**.
- **Hoje** a lista só atualiza ao clicar em **Aplicar** (comportamento legado ainda ativo).

---

## 2) Itens Observados / Bugs Corrigidos (validados)

- Hover do botão **Nova Tarefa** corrigido (não fica branco).
- **Toast central** após salvar a tarefa.
- Removida a copy sobre fuso horário no modal.
- Lista de Tasks não “some” quando há falha na consulta ordenada (fallback incluído + logs claros no console).

---

## 3) Padrões e Preferências da Dácora (NÃO NEGOCIÁVEIS)

- **Não** enviar “trechos” de código soltos; **sempre** enviar **arquivos completos** quando solicitado.
- **Não** quebrar o app que já está robusto. Alterações **cirúrgicas** e **reversíveis**.
- **Layout** sempre **harmonizado** com a identidade visual aprovada (cores, fontes, chips, sombras).
- Campos obrigatórios ao criar tarefa: **Cliente**, **Responsável**, **Descrição**, **Início**, **Limite**.  
  Status default **“não realizada”**; **não** obrigar Horas, Término, Recorrência.
- **Datas** e horas exibidas no **padrão Brasil** (base UTC-3 na apresentação).
- **Status** devem sempre respeitar o conjunto oficial; **mapear** variações externas (ex.: “aberta”) para os oficiais.

---

## 4) Itens Pendentes / “Não validados ainda”

> **Atenção**: não implementar antes de alinharmos aqui no chat. São diretrizes/planejamento.

### 4.1. Filtros Responsivos (sem botão **Aplicar**)
- **Desejo do negócio**: remover o botão **Aplicar** e filtrar **automaticamente** ao selecionar qualquer opção (Status/Cliente/Responsável/Período).
- **Plano**:
  1) Ligar `change` dos selects e `input`/`change` dos datepickers ao `TaskoraFilters.set(...)`.
  2) Disparar **imediatamente** `fetchAndFilter()` ao mudar qualquer filtro.
  3) Remover o botão **Aplicar** do markup (ou escondê-lo) e ajustar spacing do toolbar.
  4) Critérios de aceitação:
     - Troca de Status/Cliente/Responsável/Período atualiza a tabela em **< 300ms** (com cache local dos docs onde possível).
     - Não há regressão de layout.

### 4.2. Fechamento do Modal após Salvar
- Comportamento desejado: após clicar **Salvar**, **fechar** o modal e **exibir o toast** (já aparece).
- Observação atual: houve cenário em que o modal não fechou.  
  **Plano**:
  - Garantir `close()` **sempre** após `onOk(payload)` (simulação e, futuramente, persistência).
  - Adicionar **proteção** contra exceções no handler para não bloquear o fechamento.

### 4.3. Listagem Imediata da Nova Tarefa
- Desejo: após salvar, a nova tarefa **aparecer imediatamente** na lista (sem depender de Aplicar).
- **Plano** (em simulação e para futura persistência real):
  - **Otimista**: inserir a linha na coleção local (`allRows.unshift(...)`) e re-renderizar primeiro “slice”.
  - Em persistência real: ouvir **snapshot/stream** ou refazer `fetch` de forma incremental; se houver `createdAt`, ordenar corretamente.
  - Critérios: nova tarefa visível < 200ms; sem duplicar quando chegar pelo stream.

### 4.4. Fonte do filtro **Cliente** (correção)
- Observado: ao abrir o filtro global de **Cliente**, também aparecem membros de equipe (owners).  
  **Plano**:
  - Popular **Cliente** exclusivamente a partir da **fonte de clientes** (ex.: `metaRepo.listClients()`), **excluindo owners**.
  - Se necessário, deduplicar e ordenar alfabeticamente (case-insensitive).
  - Critérios: nenhum owner aparece no select de **Cliente**.

### 4.5. Botão “Nova Tarefa” na sidebar (opcional)
- **Decisão atual**: **não** adicionar agora.  
  Fica como feature opcional futura.

---

## 5) Regras de Dados (compatibilidade Dácora)

> Para evitar divergências, este app espelha os campos já usados no projeto e compatíveis com o banco da Dácora (Firestore).

### 5.1. Campos por Tarefa (payload base – **simulado**)
- `client: string` — **obrigatório**
- `owner: string` — **obrigatório**
- `description: string` — **obrigatório (min. 3 chars)**
- `status: "iniciada" | "em progresso" | "concluída" | "não realizada"`  
  - **Default:** “não realizada”  
  - **Normalização**: mapear “aberta/open/todo/pendente…” → “iniciada”
- `hours?: number` — opcional (>= 0; passo 0.5)
- `date: "YYYY-MM-DD"` — **obrigatório** (início)
- `dueDate: "YYYY-MM-DD"` — **obrigatório** (limite, >= início)
- `endDate?: "YYYY-MM-DD"` — opcional (>= início)
- **Recorrência**  
  - `recurrence.type`:  
    `none | daily | weekdays | weekly | monthly | weekly-one`
  - `recurrence.days?`:  
    - `weekdays` → `[1,2,3,4,5]`  
    - `weekly-one` → `[1..5]` (um dia)  
  - `recurrence.until?`: `"YYYY-MM-DD"` (>= início)
  - **Espelhamento p/ compatibilidade**:  
    `recurrenceType`, `recurrenceDays`, `recurrenceUntil` conforme existirem.

📌 Integração com o Banco de Dados da Dácora (Firebase)

Compatibilidade obrigatória
Todo e qualquer novo campo, módulo ou ajuste feito no aplicativo deve manter compatibilidade com a estrutura do banco da Dácora.

Antes de criar novos campos, consulte sempre o documento SCHEMA_DACORA.md para verificar se já existe algo equivalente.

Se o campo não existir, ele deve ser criado no Firebase da Dácora, e a mesma estrutura (nome do campo, tipo, formato de data, regras de validação) deve ser replicada no app.

Entradas novas

Sempre que um novo campo for adicionado (ex.: priority, tags, reminderDate), esse campo precisa estar escrito no banco da Dácora, mesmo que inicialmente não seja usado por todos os módulos.

Essa regra garante que o app continue em sincronia com o backend oficial, evitando divergências entre o que o usuário vê e o que está salvo na base.

Regras de escrita e leitura

As regras de segurança do Firebase (FIRESTORE_RULES.md) devem ser respeitadas em qualquer nova implementação.

Novos campos também precisam ser considerados em consultas, índices (INDEXES.md) e em permissões, se aplicável.

Explicação resumida

Qualquer evolução feita no app (novos módulos, novos campos, novas coleções) precisa refletir no banco da Dácora.
Isso significa que o app nunca deve criar campos “temporários” apenas no front-end. Toda informação que nasce no app precisa ter um espaço correspondente no Firebase da Dácora.
Caso contrário, o dado não será persistido corretamente e ficará fora da padronização da plataforma.

### 5.2. Datas e Fuso
- Entrada e exibição no formato **BR local** (`YYYY-MM-DD`), tratando a apresentação como **UTC-3**.  
- Na persistência real, utilizar `createdAt` (Timestamp) para ordenar, mantendo conversão consistente para exibição.

---

## 6) Critérios de Qualidade (quando evoluirmos)

- **Zero** erros no console.
- **Não** quebrar nenhuma página existente.
- **UI**: hover/active/focus visíveis e coerentes com a identidade.
- **Acessibilidade**: foco visível no modal e nos controles; `aria` básico nos toasts e no diálogo.
- **Perf**: filtro responsivo com perceção < 300 ms.
- **Logs** claros (erros com contexto), sem flood.

---

## 7) Fluxo de Entrega & Forma de Trabalho

- Sempre que for necessário código, enviar **arquivos completos** (não trechos) para colar no projeto.
- Antes de implementar algo **marcado aqui como não validado**, confirmar neste chat.
- Qualquer ajuste visual deve **respeitar** a identidade aprovada (chips, cores, tipografia).
- Evitar regressões: alterações **locais** e **reversíveis**.
- Mensagens de sucesso via **Toast central**; no modal, fechar após salvar.

---

## 8) Roadmap Proposto (em ordem)

1) **Filtros responsivos** (remover botão Aplicar) – *não validado ainda*  
2) **Fechar modal** ao salvar (robustez/try-catch) – *não validado ainda*  
3) **Inserção otimista** da nova tarefa na lista – *não validado ainda*  
4) **Corrigir fonte** do filtro **Cliente** (sem owners) – *não validado ainda*  
5) (Opcional futuro) Botão **Nova Tarefa** na sidebar.

---

## 9) Referências Internas do Projeto

- **Schema & integração Firestore**: ver `docs/SCHEMA_DACORA.md`
- **Regras de segurança**: ver `docs/FIRESTORE_RULES.md`
- **Índices**: ver `docs/INDEXES.md`
- **Histórico**: ver `docs/CHANGELOG.md`

> Observação: estes arquivos devem continuar sendo a **fonte de verdade** para compatibilidade com o banco da Dácora.

---

## 10) Checklist Operacional Rápido

- [ ] Os **status** estão nos 4 oficiais e com normalização ativa?
- [ ] **Datas** no formato BR (YYYY-MM-DD) e exibidas corretamente?
- [ ] **Toast** aparece e some no centro da tela?
- [ ] **Modal** fecha ao salvar (depois do onOk)?
- [ ] **Filtros** reagem sem “Aplicar” (quando liberarmos)?
- [ ] **Cliente** no filtro global lista **somente** clientes (sem owners)?
- [ ] **Lista** mostra nova tarefa imediatamente (otimista) — quando habilitarmos?

---

## 11) Decisões de Design que Devem Permanecer

- Chips com **cores suaves**, borda visível, **peso 700–800**.
- Botões com **contraste alto** (ex.: primário #014029/hover #013522).
- Modal com **layout grid** responsivo e cantos arredondados (16px).
- Mensagens **curtas e objetivas**; nada de cópias técnicas na UI (ex.: fuso).

---

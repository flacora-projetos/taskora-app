# 📖 READMEFIRST - Orientações Iniciais  
**Versão do app:** `taskora_v4sem_legado_new_firebase`

Este documento deve ser lido **antes de qualquer modificação no app Taskora**.  
Ele garante que todo novo colaborador ou chat siga corretamente o fluxo de trabalho, evitando retrabalho, inconsistências e perda de tempo.

---

## 📌 Objetivo
- O **Taskora** é a base tecnológica usada pela **Dácora** em **white label**.  
- **UI e branding permanecem Dácora**, com a assinatura **“powered by Taskora”** (não alterar).  
- Esta versão do app é **Taskora independente (sem legado)**, identificada por: **`taskora_v4sem_legado_new_firebase`**.  
- Firestore inicia em **modo Produção**, com **autenticação anônima habilitada** (sem tela de login).

---

## 1) Primeira Regra: Seja um **Expert no App**
Antes de escrever qualquer linha de código:
- Ler o código do ZIP base.
- Ler os documentos em `docs/`:
  - `TASKORA_GUIDE.md`, `SCHEMA_TASKORA.md`, `FIRESTORE_RULES.md`, `INDEXES.md`, `CHANGELOG.md`.
- Entender layout, páginas, componentes JS/CSS e integração com Firebase:
  - **Config** em `assets/js/config/firebase-test.js` (injeta `window.firebaseConfig`).  
  - **Bootstrap** em `assets/js/firebase.js` (inicializa `app/db`).
- **Só após familiaridade completa** começar ajustes/melhorias.
- Não implementar sem entender o fluxo inteiro.

---

## 2) Banco de Dados (Taskora, sem legado)
- Banco **independente da Dácora** (sem necessidade de compatibilização).  
- **Clientes**: `defaultAssigneeRef` (responsável padrão) e subcoleção `budgets` (orçamentos mensais por plataforma).  
- **Tarefas**: tempo em **minutos inteiros** (`estimatedMinutes`, `spentMinutes`), exibido em **HH:MM**; `assigneeRef` é obrigatório (herda do cliente se vazio).  
- **Calendário**: coleção `calendarEvents`, podendo referenciar `taskRef`.  
- **Histórico**: coleção `taskActivities` (auditoria).  
- Detalhes completos em `SCHEMA_TASKORA.md`.

---

## 3) Fluxo de Trabalho (disciplina de processo)
Sequência obrigatória: **planejamento → validação → implementação → teste (console limpo) → ajustes finais**.
- **Validar antes** de implementar (prints, modo simulado quando aplicável).
- **Entregas completas** (arquivos inteiros; nunca trechos soltos).
- **Consistência visual**: manter cores, tipografia e espaçamento existentes (UI Dácora).
- **White label**: preservar “Dácora powered by Taskora”.

---

## 4) Segurança e Índices
- Firestore em **Produção** + **autenticação anônima** ativada.  
- **Regras**: isolamento por `orgId`; papéis `viewer/member/admin`; proteção de campos de auditoria; limites de `tags` e valores. Ver `FIRESTORE_RULES.md`.  
- **Índices**: compostos para tarefas, calendário, clientes e histórico. Ver `INDEXES.md`.

---

## 5) Documentação Complementar
- `TASKORA_GUIDE.md`: visão de módulos e práticas.  
- `SCHEMA_TASKORA.md`: coleções e campos oficiais.  
- `FIRESTORE_RULES.md`: segurança e validações.  
- `INDEXES.md`: índices compostos necessários.  
- `CHANGELOG.md`: histórico de mudanças, incluindo a entrada desta versão **`taskora_v4sem_legado_new_firebase`**.

---

## 6) Validação de Melhorias
- Novas funcionalidades devem ser validadas com **dados de teste** (modo anônimo).  
- Aprovado → gravação real no Firestore.  
- Fluxos não validados devem ser sinalizados no `TASKORA_GUIDE.md`.

---

✅ Este documento é o **primeiro ponto de leitura** em cada novo chat.  
Garante consistência, reduz retrabalho e mantém a evolução alinhada ao banco Taskora e ao fluxo de trabalho definido.

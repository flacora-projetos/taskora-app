# 📖 READMEFIRST - Orientações Iniciais

Este documento deve ser lido **antes de qualquer modificação no app Taskora**. Ele garante que todo novo colaborador ou novo chat siga corretamente o fluxo de trabalho, evitando retrabalho, inconsistências e perda de tempo.

---

# READMEFIRST.md

## 📌 Primeira leitura obrigatória antes de qualquer ação

Este documento serve como guia inicial para qualquer pessoa que abra um novo chat ou dê continuidade ao desenvolvimento do **Taskora**.

### 1. Alinhamento inicial


### 1. Preferências do Product Owner

* O Product Owner valoriza **clareza, contexto e disciplina de processo**.
* Melhor demorar um pouco mais para entender do que gerar retrabalho.
* Feedbacks são contínuos e ajustes são validados em etapas.
* Mudanças visuais devem manter consistência (cores, tipografia, espaçamento).

### 2. Nota sobre postura recomendada

Essa postura de **rigor, validação e clareza antes de qualquer ação** **não atrapalha** o desenvolvimento. Pelo contrário: fortalece a robustez do aplicativo, garante consistência e evita retrabalho.

Mesmo sem formação em programação, o Product Owner está liderando como um **gestor de produto**: definindo *o que* precisa ser feito, validando cada passo e garantindo alinhamento. Essa forma de conduzir deve ser mantida e respeitada.

👉 Portanto, **seja criterioso, leia tudo, valide antes e só depois implemente**.


## 1. Primeira Regra: Seja um **Expert no App**

* Antes de escrever qualquer linha de código, o colaborador deve:

  * Ler todo o código-fonte enviado no **ZIP base**.
  * Ler os documentos disponíveis na pasta **`docs/`** (TASKORA\_GUIDE.md, SCHEMA\_DACORA.md, FIRESTORE\_RULES.md, INDEXES.md, CHANGELOG.md).
  * Analisar o layout, estrutura de páginas, componentes JS, CSS e a integração atual com o Firebase.
* Só após **completa familiaridade** com a aplicação é que ajustes ou melhorias podem começar.
* Nunca comece a implementar sem entender todo o fluxo. Isso já foi um problema em etapas anteriores e não deve se repetir.

---

## 2. Integração com o Banco de Dados da Dácora (Firebase)

* Todo e qualquer novo campo, módulo ou ajuste feito no aplicativo deve **manter compatibilidade com a estrutura do banco da Dácora**.
* **Consulta obrigatória**: Antes de criar novos campos, verifique o **SCHEMA\_DACORA.md**.
* Se o campo não existir, ele precisa ser criado também no **Firebase da Dácora**, e **replicado com o mesmo nome e formato** no app.
* **Entradas novas**: Novos campos como `priority`, `tags`, `reminderDate` etc. precisam estar escritos no banco. Não devem existir campos apenas locais no app.
* **Resumo da regra**:

  > Qualquer evolução feita no app (novos módulos, novos campos, novas coleções) precisa refletir no banco da Dácora. Não existe “campo temporário” apenas no front-end.

---

## 3. Fluxo de Trabalho e Diretrizes

* Sempre validar com o usuário **antes de implementar**.
* Nunca enviar **trechos de código soltos**. Os arquivos devem ser entregues **completos**, para evitar erros de colagem.
* Todas as entregas devem ser consistentes com o layout já existente (cores, tipografia, harmonia visual).
* Alterações visuais devem ser feitas com base em prints/modelos enviados, mas **nunca copiar literalmente** – apenas usar como inspiração.
* As tarefas seguem a sequência: **planejamento → validação → implementação → teste com console limpo → ajustes finais**.

---

## 4. Documentação Complementar

* **TASKORA\_GUIDE.md**: Guia completo de tudo que já foi feito, validado e pendente.
* **SCHEMA\_DACORA.md**: Estrutura de dados do banco Firebase da Dácora.
* **FIRESTORE\_RULES.md**: Regras de segurança e permissões.
* **INDEXES.md**: Índices obrigatórios para queries.
* **CHANGELOG.md**: Histórico de mudanças.

---

## 5. Validação de Melhorias

* Qualquer funcionalidade nova deve ser validada **primeiro em modo simulado** (payload exibido no console, sem gravação real).
* Somente após aprovação deve ser integrada de fato ao Firebase.
* Fluxos não validados ainda devem ser registrados no **TASKORA\_GUIDE.md** como “não validados ainda”.
A CADA NOVA MELHORIA VALIDADA NO APP LEMBRAR DE PEDIR PARA ATUALIZAR OS ARQUIVOS DA PASTA DOC ONDE ESSAS MELHORIAS CAUSEM QUALQUER TIPO DE IMPACTO.

---

✅ Este documento serve como **primeiro ponto de leitura em cada novo chat**.
Ele garante consistência, evita erros de comunicação e assegura que a evolução do app esteja sempre alinhada com o banco de dados da Dácora e com o fluxo de trabalho já definido.

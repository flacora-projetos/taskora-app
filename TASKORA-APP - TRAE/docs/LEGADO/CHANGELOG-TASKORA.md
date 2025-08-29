# Taskora v029

* Base SPA modularizada
* Abas: LOG, Calendário, Clientes, Histórico
* Branding: “Dácora | Powered by Taskora”
* Firebase Firestore com init robusto + shim
* Layout refinado: header fixo, sidebar compacta, card principal

---

# Taskora v030

* Implementação inicial dos **filtros globais** (Status, Cliente, Responsável, Datas)
* Estruturação do **modal de Nova Tarefa** dentro da página *Tasks*
* Correções visuais iniciais: identidade de cores aplicada nos botões e hover states

---

# Taskora v031

* Ajuste dos **status de tarefas** para refletir corretamente: `iniciada`, `em progresso`, `concluída`, `não realizada`
* Substituição dos rótulos incorretos (ex.: `a fazer`, `em andamento`, `bloqueado`)
* Integração inicial com Firebase TEST para simulação de criação de tarefas
* Estrutura de listagem de tarefas conectada ao Firestore

---

# Taskora v032

* **Nova Tarefa (modal):** botão adicionado na página *Tasks*, com formulário completo
* **Fluxo do modal:** salvar → Toast de confirmação no centro da tela → (não validado ainda: fechamento automático + listagem imediata)
* Ajustes de layout: remoção de mensagens desnecessárias (ex.: aviso de fuso horário)
* Correções no hover e estilo do botão “Nova Tarefa”
* **Filtros globais responsivos (planejado):** botão "Aplicar" considerado redundante; será removido quando auto-filtragem for validada

---

# Notas importantes

* Este **CHANGELOG.md** registra apenas versões **já validadas** ou em processo de validação.
* Para detalhes de fluxo de trabalho, diretrizes de desenvolvimento e preferências de entrega, consulte o documento **TASKORA\_GUIDE.md**.
* Para leitura obrigatória antes de qualquer evolução do app, consulte o **READMEFIRST.md**.
* Para integração com o banco de dados Dácora no Firebase, consulte os docs: **SCHEMA\_DACORA.md**, **FIRESTORE\_RULES.md**, **INDEXES.md**.

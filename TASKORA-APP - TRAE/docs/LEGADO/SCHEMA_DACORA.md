# Firestore — Esquema da Dácora (Compatibilidade Oficial)

> Documento de referência para manter o Taskora compatível com a base já existente da Dácora.

## Coleção: `tasks`

| Campo                     | Tipo        | Observações                                                                 |
|--------------------------|-------------|------------------------------------------------------------------------------|
| `client`                 | string      | Nome do cliente.                                                            |
| `createdAt`              | timestamp   | ÚNICO campo de data em Timestamp.                                           |
| `date`                   | string      | Data base da tarefa (string, ex: `2025-08-19`).                             |
| `description`            | string      | Texto longo.                                                                |
| `dueDate`                | string      | Prazo/entrega (string, ex: `2025-08-19`).                                   |
| `hours`                  | number      | Esforço estimado/lançado em horas.                                          |
| `owner`                  | string      | Responsável textual.                                                        |
| `recurrence`             | map         | Mapa contendo propriedades de recorrência.                                  |
| `recurrence.type`        | string      | Ex.: `"none"`, `"weekdays"`, `"custom"`.                                    |
| `recurrence.days`        | array       | Array de dias (números ou strings conforme legado).                         |
| `recurrence.recurrenceType` | string  | Tipo adicional de regra (quando houver).                                    |
| `recurrence.recurrenceUntil`| string  | Limite (string de data).                                                    |
| `status`                 | string      | Livre no legado; recomendação: `todo|doing|blocked|done`.                   |

### Regras de compatibilidade
- **Não alterar tipos do legado**: datas que são `string` devem permanecer `string` nas escritas do Taskora.
- **Normalização na leitura**: o app converte strings de data para objetos `Date`/`dayjs` apenas em memória.
- **Validação na escrita**: o app impede envio de campos inesperados e preserva o formato legado.
- **Índices**: criar sob demanda (ver `docs/INDEXES.md`).

### Campos opcionais futuros (Taskora)
- `clientId`, `assigneeId`, `tags[]`, `priority`, etc.  
> Se introduzidos, devem ser opcionais e não quebrar leituras de dados legados.

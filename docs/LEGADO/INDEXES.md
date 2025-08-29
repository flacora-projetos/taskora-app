# Firestore Indexes — Recomendações

Crie estes índices conforme as consultas forem pedindo no console:

- `tasks`:
  - `status ASC, date ASC` (strings de data)
  - `client ASC, status ASC, date ASC`
  - `owner ASC, status ASC, date ASC`
  - `status ASC, createdAt DESC`

Observação: como `date`/`dueDate` são **string** no legado, padronize o formato `YYYY-MM-DD` para ordenação correta.

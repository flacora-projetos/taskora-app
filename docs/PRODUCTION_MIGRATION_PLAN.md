# 📋 Plano de Migração para Produção - Taskora

## 🎯 Objetivo
Migrar os dados da Dácora do ambiente de teste para o ambiente de produção do Taskora de forma segura e controlada.

## ⚠️ Pré-requisitos
- ✅ Migração testada e validada no ambiente de desenvolvimento
- ✅ Ferramentas de migração funcionando corretamente
- ✅ Backup do ambiente atual disponível

## 📅 Cronograma Sugerido

### Fase 1: Preparação (1-2 dias)
1. **Backup Completo**
   - Exportar todos os dados do Firebase de produção
   - Documentar estrutura atual das coleções
   - Criar ponto de restauração

2. **Validação Final do Teste**
   - Verificar integridade dos dados migrados
   - Testar funcionalidades do Taskora com dados migrados
   - Confirmar que não há erros de conexão

### Fase 2: Configuração (30 min)
3. **Atualizar Configurações**
   - Modificar ferramentas para ambiente de produção
   - Verificar credenciais e permissões
   - Testar conexão com Firebase de produção

### Fase 3: Execução (1-2 horas)
4. **Migração dos Dados**
   - Executar migração offline primeiro
   - Importar dados para Firebase de produção
   - Monitorar logs durante o processo

5. **Validação Imediata**
   - Verificar contagem de registros
   - Testar consultas básicas
   - Validar estrutura dos dados

### Fase 4: Integração (2-4 horas)
6. **Atualizar Aplicação**
   - Modificar referências no código principal
   - Atualizar queries para novas coleções
   - Testar funcionalidades críticas

7. **Testes de Produção**
   - Executar testes de fumaça
   - Verificar performance
   - Validar com usuários finais

### Fase 5: Finalização (1 dia)
8. **Limpeza (Opcional)**
   - Remover coleções antigas (após 48h de validação)
   - Documentar mudanças realizadas
   - Atualizar documentação do sistema

## 🔧 Ferramentas Necessárias

### Para Backup
```bash
# Usar ferramenta de export do Firebase
firebase firestore:export gs://seu-bucket/backup-pre-migration
```

### Para Migração
1. **migrate-dacora-offline.html** - Migração offline dos dados
2. **import-migrated-data.html** - Importação para Firebase (configurar para produção)
3. **firebase-connection-test.html** - Teste de conexão

## ⚡ Plano de Rollback

### Se algo der errado durante a migração:

1. **Parar imediatamente** a migração
2. **Restaurar backup** do Firebase
3. **Reverter alterações** no código da aplicação
4. **Investigar problema** nos logs
5. **Corrigir e testar** novamente no ambiente de desenvolvimento

### Comandos de Rollback
```bash
# Restaurar backup
firebase firestore:import gs://seu-bucket/backup-pre-migration

# Reverter deploy (se aplicável)
git revert <commit-hash>
```

## 📊 Checklist de Validação

### Antes da Migração
- [ ] Backup completo realizado
- [ ] Ferramentas testadas no ambiente de produção
- [ ] Equipe notificada sobre a migração
- [ ] Janela de manutenção agendada

### Durante a Migração
- [ ] Logs sendo monitorados
- [ ] Contagem de registros conferida
- [ ] Sem erros de conexão
- [ ] Performance dentro do esperado

### Após a Migração
- [ ] Todos os clientes migrados (40 registros)
- [ ] Todos os membros da equipe migrados (3 registros)
- [ ] Aplicação funcionando normalmente
- [ ] Usuários conseguem acessar dados
- [ ] Performance mantida ou melhorada

## 🚨 Contatos de Emergência

- **Desenvolvedor Principal**: [Seu contato]
- **Administrador Firebase**: [Contato do admin]
- **Suporte Técnico**: [Contato do suporte]

## 📝 Notas Importantes

1. **Horário Recomendado**: Executar durante horário de menor uso
2. **Comunicação**: Notificar usuários sobre possível indisponibilidade
3. **Monitoramento**: Acompanhar métricas por 48h após migração
4. **Documentação**: Registrar todos os passos executados

## 🔄 Estrutura de Dados Migrados

### Coleção `clients` (40 registros)
```javascript
{
  id: "client_id",
  name: "Nome do Cliente",
  email: "email@cliente.com",
  phone: "telefone",
  address: "endereço",
  createdAt: timestamp,
  updatedAt: timestamp,
  status: "active"
}
```

### Coleção `team` (3 registros)
```javascript
{
  id: "member_id",
  name: "Nome do Membro",
  email: "email@membro.com",
  role: "função",
  permissions: ["permissões"],
  createdAt: timestamp,
  updatedAt: timestamp,
  status: "active"
}
```

---

**Data de Criação**: 02/09/2025  
**Versão**: 1.0  
**Status**: Pronto para Execução
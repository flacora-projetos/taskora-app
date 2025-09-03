# Configuração de Bancos de Dados - Taskora

## 📊 Visão Geral

Este documento esclarece a configuração dos bancos de dados utilizados no projeto Taskora, eliminando confusões sobre ambientes e migrações.

## 🎯 Banco de Dados Ativo (Produção)

### dacora---tarefas
- **Status**: ✅ ATIVO - Banco principal em produção
- **Project ID**: `dacora---tarefas`
- **Auth Domain**: `dacora---tarefas.firebaseapp.com`
- **Storage Bucket**: `dacora---tarefas.firebasestorage.app`
- **Configuração**: `assets/js/config/firebase-production.js`
- **Usado por**: Aplicação principal (`taskora_v5.5.2_performance_balance_control.html`)

### Características:
- Contém todos os dados de produção
- Operações CRUD ativas
- Autenticação anônima habilitada
- Sem tela de login

## 🔄 Banco de Migração (Inativo)

### taskora-39404
- **Status**: ⚠️ INATIVO - Usado apenas para migração de dados legados
- **Project ID**: `taskora-39404`
- **Auth Domain**: `taskora-39404.firebaseapp.com`
- **Storage Bucket**: `taskora-39404.firebasestorage.app`
- **Usado por**: Ferramentas de migração manuais

### Ferramentas que utilizam este banco:
- `tools/migracao-estrategica-dacora-taskora.html`
- `tools/teste-conexao-taskora-39404.html`
- `migrar-dados-brutos-dacora.html`
- `migrar-dados-brutos-final.html`
- `diagnosticar-firebase-taskora.html`
- Outros scripts de migração no diretório `tools/`

## ⚡ Operações de Escrita

### ✅ Repositórios Centralizados (Recomendado)
- `assets/js/data/tasksRepo.js` - Gestão de tarefas
- `assets/js/data/clientsRepo.js` - Gestão de clientes
- `assets/js/data/teamRepo.js` - Gestão da equipe
- `assets/js/data/metaRepo.js` - Dados auxiliares

### ⚠️ Operações Diretas (Para Otimização)
- `assets/js/pages/tasks.js` - Contém operações CRUD diretas que poderiam ser centralizadas

## 🔒 Confirmação de Segurança

### ✅ NÃO há escritas simultâneas em dois bancos
- O sistema opera exclusivamente no banco `dacora---tarefas`
- O banco `taskora-39404` é usado apenas para migração manual
- Não há conflitos de dados ou operações duplicadas

## 📝 Histórico de Alterações

### 2025-01-14
- ✅ Renomeado `firebase-test.js` → `firebase-production.js`
- ✅ Atualizada referência no arquivo HTML principal
- ✅ Adicionados comentários claros sobre ambiente de produção
- ✅ Confirmado que não há escritas simultâneas em bancos diferentes

## 🚀 Próximos Passos

1. **Centralizar operações CRUD**: Mover operações diretas do `tasks.js` para repositórios
2. **Criar ambiente de teste**: Configurar banco separado para desenvolvimento
3. **Documentar migrações**: Catalogar todas as ferramentas de migração disponíveis

## 📞 Suporte

Para dúvidas sobre configuração de banco de dados:
- Consulte este documento primeiro
- Verifique os comentários nos arquivos de configuração
- Analise os logs do console do navegador para confirmação do projeto ativo
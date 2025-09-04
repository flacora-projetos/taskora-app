# 🤖 Taskora Cloud Functions - Etapa 2

## 📋 Automações Implementadas

### 1. **Backup Automático Diário** 📦
- **Quando:** Todo dia às 2h da manhã
- **O que faz:** Salva todos os dados no Cloud Storage
- **Notificação:** Email de confirmação

### 2. **Lembretes Automáticos** 📧
- **Quando:** Todo dia às 9h da manhã
- **O que faz:** Verifica tarefas vencendo e atrasadas
- **Notificação:** Email com lista de tarefas

## 🚀 Como Configurar

### Pré-requisitos
1. ✅ Plano Blaze do Firebase ativado
2. ✅ Firebase CLI instalado
3. ✅ Node.js 18+ instalado

### Passo 1: Instalar Dependências
```bash
cd functions
npm install
```

### Passo 2: Configurar Email ✅ CONCLUÍDO
**Configurações já aplicadas no projeto:**
- ✅ **Email do Sistema:** `equipe@nandacora.com.br`
- ✅ **Senha de Aplicativo:** Configurada com Google Workspace
- ✅ **Email do Admin:** `flacora@gmail.com`

### Passo 3: Variáveis no Firebase ✅ CONFIGURADAS
```bash
# ✅ Já configurado no projeto
firebase functions:config:set email.user="equipe@nandacora.com.br"
firebase functions:config:set email.pass="[SENHA_CONFIGURADA]"
firebase functions:config:set admin.email="flacora@gmail.com"
```

**Status:** ✅ Todas as variáveis estão configuradas e funcionando

### Passo 4: Deploy das Functions ✅ CONCLUÍDO
```bash
# ✅ Já realizado
firebase deploy --only functions
```

## 🌐 URLs Funcionais

### Endpoints Ativos
- **Status das Automações:** https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes
- **Teste Manual:** https://southamerica-east1-dacora---tarefas.cloudfunctions.net/testarAutomacoes

### Status Atual ✅
- ✅ **Cloud Functions:** 4 functions implantadas e operacionais
- ✅ **Cloud Scheduler:** 2 triggers configurados (2h e 9h)
- ✅ **Email:** Sistema de notificações funcionando
- ✅ **Backup:** Armazenamento no Cloud Storage ativo
- ✅ **Monitoramento:** 183 tarefas sendo monitoradas

## 📧 Configuração do Gmail

### Para usar Gmail como servidor de email:

1. **Ativar autenticação de 2 fatores**
   - Acesse: https://myaccount.google.com/security
   - Ative a verificação em 2 etapas

2. **Gerar senha de app**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" > "Outro"
   - Digite "Taskora Functions"
   - Use a senha gerada no campo `EMAIL_PASS`

## 🧪 Como Testar

### Teste Manual
```bash
# Testar localmente
firebase emulators:start --only functions

# Em outro terminal, testar as functions
curl http://localhost:5001/dacora---tarefas/southamerica-east1/testarAutomacoes
```

### Verificar Status
```bash
# Verificar se está funcionando
curl https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes
```

## 📊 Monitoramento

### Logs das Functions
```bash
# Ver logs em tempo real
firebase functions:log

# Ver logs específicos
firebase functions:log --only backupDiario
firebase functions:log --only lembretesAutomaticos
```

### Console do Firebase
1. Acesse: https://console.firebase.google.com
2. Vá em "Functions"
3. Monitore execuções e logs

## 📁 Estrutura dos Backups

Os backups são salvos no Cloud Storage com a estrutura:
```
backups/
├── taskora_backup_2025-01-31_02-00-00.json
├── taskora_backup_2025-02-01_02-00-00.json
└── ...
```

Cada backup contém:
- **tasks:** Todas as tarefas
- **clients:** Todos os clientes
- **team:** Dados da equipe
- **settings:** Configurações do sistema

## 📧 Emails Automáticos

### Email de Backup (Diário às 2h)
```
✅ Taskora - Backup Realizado com Sucesso

🎉 Backup Automático Concluído
Data/Hora: 31/01/2025 às 02:00
Total de documentos: 150

📊 Detalhes por Coleção:
• tasks: 85 documentos
• clients: 42 documentos
• team: 15 documentos
• settings: 8 documentos
```

### Email de Lembretes (Diário às 9h)
```
📋 Lembretes de Tarefas - Taskora

⏰ Tarefas Vencendo em 2 Dias (3):
• Relatório Meta Ads - Cliente XYZ
• Reunião de alinhamento - Cliente ABC

🚨 Tarefas Atrasadas (1):
• Entrega de arte - Cliente DEF (Atrasada há 2 dias)
```

## 🔧 Solução de Problemas

### Erro: "Function deployment failed"
```bash
# Verificar se está logado
firebase login

# Verificar projeto
firebase use --list
firebase use dacora---tarefas
```

### Erro: "Email not sent"
1. Verifique as credenciais do Gmail
2. Confirme que a senha de app está correta
3. Verifique os logs: `firebase functions:log`

### Erro: "Permission denied"
1. Verifique se o plano Blaze está ativo
2. Confirme as permissões do projeto
3. Verifique as regras do Firestore

## 💰 Custos Estimados

### Cloud Functions
- **Invocações:** 2 por dia = 60/mês
- **Tempo de execução:** ~30 segundos cada
- **Custo estimado:** $0.10-0.50/mês

### Cloud Storage (Backups)
- **Armazenamento:** ~1MB por backup
- **30 backups/mês:** ~30MB
- **Custo estimado:** $0.01/mês

**Total estimado: $0.11-0.51/mês**

## 🎯 Próximos Passos

Após implementar a Etapa 2, você pode avançar para:

1. **Etapa 3:** Tarefas Recorrentes
2. **Etapa 4:** Relatórios Automáticos para Clientes
3. **Etapa 5:** Integração com Meta Ads

---

**Versão:** 1.0.0 - Etapa 2  
**Última atualização:** Janeiro 2025  
**Suporte:** Consulte os logs do Firebase Functions
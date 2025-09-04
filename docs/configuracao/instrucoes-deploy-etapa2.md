# 🚀 INSTRUÇÕES PARA DEPLOY - ETAPA 2

## ✅ Status Atual

✅ **Cloud Functions configuradas**  
✅ **Dependências instaladas**  
✅ **Código implementado**  
⏳ **Aguardando login e deploy**

---

## 🔑 PRÓXIMOS PASSOS OBRIGATÓRIOS

### 1. **Fazer Login no Firebase**
```bash
firebase login
```
- Isso abrirá seu navegador
- Faça login com a conta do Google que tem acesso ao projeto Firebase
- Autorize o Firebase CLI

### 2. **Verificar Projeto Ativo**
```bash
firebase use dacora---tarefas
```

### 3. **Configurar Variáveis de Email**

**Opção A: Via Firebase CLI (Recomendado)**
```bash
firebase functions:config:set email.user="seu-email@gmail.com"
firebase functions:config:set email.pass="sua-senha-de-app"
firebase functions:config:set admin.email="admin@suaempresa.com"
```

**Opção B: Via Console Firebase**
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em "Functions" > "Configuração"
4. Adicione as variáveis de ambiente

### 4. **Fazer Deploy das Functions**
```bash
firebase deploy --only functions
```

---

## 📧 CONFIGURAÇÃO DO EMAIL (IMPORTANTE!)

### Para Gmail:

1. **Ativar autenticação de 2 fatores**
   - Acesse: https://myaccount.google.com/security
   - Ative a "Verificação em 2 etapas"

2. **Gerar senha de app**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" > "Outro (nome personalizado)"
   - Digite "Taskora Functions"
   - **Use a senha gerada de 16 caracteres** (não sua senha normal)

3. **Configurar as variáveis:**
   ```bash
   firebase functions:config:set email.user="seuemail@gmail.com"
   firebase functions:config:set email.pass="abcd efgh ijkl mnop"  # Senha de app
   firebase functions:config:set admin.email="admin@suaempresa.com"
   ```

---

## 🧪 COMO TESTAR APÓS O DEPLOY

### 1. **Verificar Status**
```bash
curl https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes
```

### 2. **Testar Manualmente**
```bash
curl https://southamerica-east1-dacora---tarefas.cloudfunctions.net/testarAutomacoes
```

### 3. **Ver Logs**
```bash
firebase functions:log
```

---

## 📊 O QUE ACONTECERÁ APÓS O DEPLOY

### **Backup Automático** 📦
- **Quando:** Todo dia às 2h da manhã
- **O que faz:** Salva todos os dados (tasks, clients, team, settings)
- **Onde:** Cloud Storage do Firebase
- **Notificação:** Email de confirmação

### **Lembretes Automáticos** 📧
- **Quando:** Todo dia às 9h da manhã
- **O que verifica:**
  - Tarefas vencendo em 2 dias
  - Tarefas atrasadas
- **Notificação:** Email com lista de tarefas

---

## 💰 CUSTOS ESTIMADOS

- **Cloud Functions:** $0.10-0.50/mês
- **Cloud Storage:** $0.01/mês
- **Total:** $0.11-0.51/mês

---

## 🚨 RESOLUÇÃO DE PROBLEMAS

### Erro: "Permission denied"
- Verifique se o plano Blaze está ativo
- Confirme que está logado na conta correta

### Erro: "Email not sent"
- Verifique se usou a senha de app (não a senha normal)
- Confirme que a autenticação de 2 fatores está ativa

### Erro: "Function deployment failed"
```bash
# Verificar se está no projeto correto
firebase use --list
firebase use dacora---tarefas

# Tentar novamente
firebase deploy --only functions
```

---

## 📞 COMANDOS RESUMIDOS

```bash
# 1. Login
firebase login

# 2. Configurar projeto
firebase use dacora---tarefas

# 3. Configurar email
firebase functions:config:set email.user="seuemail@gmail.com"
firebase functions:config:set email.pass="senha-de-app-16-chars"
firebase functions:config:set admin.email="admin@suaempresa.com"

# 4. Deploy
firebase deploy --only functions

# 5. Testar
curl https://southamerica-east1-dacora---tarefas.cloudfunctions.net/statusAutomacoes
```

---

**🎉 Após completar estes passos, a Etapa 2 estará 100% implementada e funcionando!**

**Próxima etapa:** Tarefas Recorrentes (Etapa 3)
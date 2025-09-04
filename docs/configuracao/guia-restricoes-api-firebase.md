# Guia: Configuração de Restrições de API no Firebase Console

> **🔒 IMPORTANTE:** Este guia substitui o conceito incorreto de "rotação de chaves" por medidas de segurança reais e efetivas.

## Por que Configurar Restrições de API?

As chaves do Firebase (apiKey, projectId, etc.) são **públicas por design** e aparecem no código do cliente. A segurança real vem das **restrições de API** e **regras de segurança**, não da ocultação das chaves.

### Benefícios das Restrições:
- ✅ Impede uso não autorizado da API
- ✅ Controla quais domínios podem acessar o projeto
- ✅ Reduz riscos de abuso e custos inesperados
- ✅ Monitora e limita o uso da API

---

## Passo 1: Acessar o Google Cloud Console

### 1.1 Fazer Login
1. Acesse: https://console.cloud.google.com/
2. Faça login com a conta do Google que possui o projeto Firebase
3. Selecione o projeto **"dacora---tarefas"**

### 1.2 Navegar para APIs e Serviços
1. No menu lateral esquerdo, clique em **"APIs e serviços"**
2. Clique em **"Credenciais"**

---

## Passo 2: Configurar Restrições da Chave de API

### 2.1 Localizar a Chave de API
1. Na seção **"Chaves de API"**, encontre a chave que termina com: `...ba56fce`
2. Clique no **ícone de lápis (editar)** ao lado da chave

### 2.2 Configurar Restrições de Aplicativo

#### Opção A: Restrições por Referenciador HTTP (Recomendado)
1. Selecione **"Referenciadores HTTP (sites)"**
2. Adicione os domínios autorizados:
   ```
   localhost:*
   127.0.0.1:*
   *.vercel.app/*
   *.netlify.app/*
   *.firebase.app/*
   *.web.app/*
   ```
3. **Adicione seu domínio personalizado** se tiver:
   ```
   seudominio.com/*
   *.seudominio.com/*
   ```

#### Opção B: Restrições por Endereço IP (Mais Restritivo)
1. Selecione **"Endereços IP"**
2. Adicione os IPs autorizados:
   - IP do seu escritório/casa
   - IPs dos servidores de produção
   - Range de IPs da Vercel/Netlify (se usar)

### 2.3 Configurar Restrições de API
1. Na seção **"Restrições de API"**, selecione **"Restringir chave"**
2. Marque apenas as APIs necessárias:
   - ✅ **Cloud Firestore API**
   - ✅ **Firebase Authentication API**
   - ✅ **Cloud Storage for Firebase API**
   - ✅ **Cloud Functions for Firebase API**
   - ❌ Desmarque todas as outras APIs

### 2.4 Salvar Configurações
1. Clique em **"Salvar"**
2. Aguarde alguns minutos para as alterações serem aplicadas

---

## Passo 3: Configurar Restrições Adicionais

### 3.1 Configurar Domínios Autorizados no Firebase
1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto **"dacora---tarefas"**
3. Vá em **"Authentication" > "Settings" > "Authorized domains"**
4. Adicione os domínios onde a aplicação será hospedada:
   ```
   localhost
   seudominio.com
   app.seudominio.com
   ```

### 3.2 Configurar Cotas e Limites
1. No Google Cloud Console, vá em **"APIs e serviços" > "Cotas"**
2. Procure por **"Cloud Firestore API"**
3. Configure limites diários/mensais apropriados:
   - **Leituras por dia:** 50.000 (ajuste conforme necessário)
   - **Gravações por dia:** 20.000 (ajuste conforme necessário)
   - **Exclusões por dia:** 5.000 (ajuste conforme necessário)

---

## Passo 4: Monitoramento e Alertas

### 4.1 Configurar Alertas de Uso
1. No Google Cloud Console, vá em **"Monitoring" > "Alerting"**
2. Clique em **"Create Policy"**
3. Configure alertas para:
   - Uso excessivo de leituras do Firestore
   - Uso excessivo de gravações do Firestore
   - Tentativas de acesso negadas

### 4.2 Configurar Orçamento
1. Vá em **"Billing" > "Budgets & alerts"**
2. Clique em **"Create Budget"**
3. Configure:
   - **Nome:** "Taskora - Orçamento Mensal"
   - **Valor:** $10 USD (ajuste conforme necessário)
   - **Alertas:** 50%, 90%, 100% do orçamento

---

## Passo 5: Verificação e Testes

### 5.1 Testar Acesso Autorizado
1. Acesse a aplicação pelo domínio autorizado
2. Verifique se todas as funcionalidades funcionam normalmente
3. Monitore o console do navegador para erros

### 5.2 Testar Bloqueio de Acesso
1. Tente acessar a aplicação de um domínio não autorizado
2. Deve aparecer erro de "API key not valid"
3. Verifique os logs no Firebase Console

### 5.3 Monitorar Logs
1. No Firebase Console, vá em **"Analytics" > "Events"**
2. Monitore eventos suspeitos ou picos de uso
3. Configure alertas para atividades anômalas

---

## Configurações Recomendadas por Ambiente

### Desenvolvimento
```
Domínios autorizados:
- localhost:*
- 127.0.0.1:*
- *.ngrok.io/* (se usar túneis)

APIs habilitadas:
- Todas as APIs do Firebase

Limites:
- Mais permissivos para testes
```

### Produção
```
Domínios autorizados:
- seudominio.com/*
- *.seudominio.com/*
- dominio-de-producao.com/*

APIs habilitadas:
- Apenas APIs necessárias

Limites:
- Restritivos baseados no uso real
```

---

## Troubleshooting

### Erro: "API key not valid"
**Causa:** Domínio não autorizado ou restrições muito restritivas
**Solução:**
1. Verifique se o domínio está na lista de autorizados
2. Aguarde 5-10 minutos após alterações
3. Limpe cache do navegador

### Erro: "This API key is not authorized"
**Causa:** API específica não habilitada para a chave
**Solução:**
1. Vá nas restrições da chave de API
2. Adicione a API necessária à lista
3. Salve e aguarde propagação

### Uso Excessivo Inesperado
**Causa:** Possível abuso ou loop infinito
**Solução:**
1. Verifique logs de uso no Firebase Console
2. Identifique padrões anômalos
3. Ajuste limites temporariamente
4. Investigue código para loops ou vazamentos

---

## Checklist Final

- [ ] ✅ Chave de API configurada com restrições de domínio
- [ ] ✅ APIs desnecessárias removidas das permissões
- [ ] ✅ Domínios autorizados configurados no Firebase Auth
- [ ] ✅ Cotas e limites definidos apropriadamente
- [ ] ✅ Alertas de uso configurados
- [ ] ✅ Orçamento mensal definido
- [ ] ✅ Testes de acesso autorizado realizados
- [ ] ✅ Testes de bloqueio de acesso realizados
- [ ] ✅ Monitoramento de logs ativo

---

## Próximos Passos

Após configurar as restrições de API:

1. **Atualizar regras do Firestore** para usuários autenticados
2. **Implementar monitoramento contínuo** de uso
3. **Revisar periodicamente** as configurações de segurança
4. **Documentar** qualquer alteração para a equipe

---

**⚠️ IMPORTANTE:** Mantenha este guia atualizado conforme as configurações evoluem. A segurança é um processo contínuo, não uma configuração única.

**📞 Suporte:** Em caso de dúvidas, consulte a [documentação oficial do Firebase](https://firebase.google.com/docs/projects/api-keys) ou entre em contato com o suporte técnico.
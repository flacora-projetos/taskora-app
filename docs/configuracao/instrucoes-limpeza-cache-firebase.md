# 🔧 Instruções para Limpeza de Cache - Firebase API Key

**Data:** 15/09/2025  
**Problema:** Erro `auth/api-key-not-valid` persistindo devido ao cache do navegador  
**Status:** ✅ CORREÇÕES IMPLEMENTADAS - AGUARDANDO TESTE

## 🎯 Problema Identificado

O erro `auth/api-key-not-valid` persiste mesmo após as correções porque:

1. **Cache do Navegador:** O navegador está usando uma versão em cache dos arquivos JavaScript
2. **Configuração Antiga:** A chave placeholder `CHAVE_REMOVIDA_POR_SEGURANCA` ainda aparece nas requisições
3. **Service Workers:** Podem estar servindo versões antigas dos arquivos

## ✅ Correções Implementadas

### Arquivos Corrigidos:
- `taskora-app/assets/js/config/firebase-config.js` - ✅ Forçar reload da configuração
- `taskora-app/assets/js/config/firebase.js` - ✅ Logs de debug adicionados
- `taskora-app/debug-firebase-config.html` - ✅ Ferramenta de debug criada

### Melhorias Adicionadas:
- **Logs de Debug:** Para verificar qual chave está sendo usada
- **Limpeza de Cache:** Força remoção de configurações antigas
- **Timestamps:** Para identificar versões dos arquivos

## 🚀 Instruções para Resolver

### Passo 1: Fazer Deploy das Correções
```bash
# No GitHub Desktop:
1. Fazer commit das alterações
2. Push para o repositório
3. Aguardar deploy automático do Vercel (2-3 minutos)
```

### Passo 2: Limpar Cache do Navegador

#### Opção A - Limpeza Completa (RECOMENDADO)
1. **Chrome/Edge:**
   - Pressione `Ctrl + Shift + Delete`
   - Selecione "Todo o período"
   - Marque: "Imagens e arquivos em cache" e "Dados de aplicativos hospedados"
   - Clique em "Limpar dados"

2. **Firefox:**
   - Pressione `Ctrl + Shift + Delete`
   - Selecione "Tudo"
   - Marque: "Cache" e "Dados de sites"
   - Clique em "Limpar agora"

#### Opção B - Limpeza Específica do Site
1. Abra as **Ferramentas do Desenvolvedor** (`F12`)
2. Vá para a aba **Application/Aplicativo**
3. No menu lateral, clique em **Storage/Armazenamento**
4. Clique em **Clear site data/Limpar dados do site**

### Passo 3: Usar Ferramenta de Debug

1. **Acesse:** `https://seu-dominio.vercel.app/debug-firebase-config.html`
2. **Clique em:** "🗑️ Limpar Cache"
3. **Clique em:** "🧪 Testar Configuração"
4. **Verifique:** Se a API Key mostrada termina com "...xtEQ"

### Passo 4: Teste em Aba Anônima

1. **Abra uma aba anônima/privada** (`Ctrl + Shift + N`)
2. **Acesse:** `https://seu-dominio.vercel.app`
3. **Teste:** Criação de usuário
4. **Verifique:** Se o erro persiste

## 🔍 Verificações de Debug

### No Console do Navegador (F12):
```javascript
// Verificar configuração carregada
console.log(window.firebaseConfig);

// Verificar se a chave está correta
console.log(window.firebaseConfig?.apiKey);

// Deve mostrar: "AIzaSyD8Qv-wQBJsGrYAhY_6T1iHdWCjtjmxtEQ"
```

### Logs Esperados:
```
[Taskora] Firebase config carregado (v14.01.2025): dacora---tarefas
[Taskora] API Key ativa: AIzaSyD8Qv-wQBJsGrYA...
[Firebase] Configuração carregada - API Key: AIzaSyD8Qv-wQBJsGrYA...
```

## ⚠️ Se o Problema Persistir

### Verificações Adicionais:

1. **Service Workers:**
   ```javascript
   // No console do navegador:
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
     for(let registration of registrations) {
       registration.unregister();
     }
   });
   ```

2. **Verificar Network Tab:**
   - Abra F12 → Network
   - Recarregue a página
   - Procure por requisições para `identitytoolkit.googleapis.com`
   - Verifique se a URL contém a chave correta

3. **Hard Refresh:**
   - Pressione `Ctrl + F5` ou `Ctrl + Shift + R`
   - Ou segure `Shift` e clique no botão de recarregar

## 📋 Checklist de Verificação

- [ ] ✅ Deploy realizado no Vercel
- [ ] ✅ Cache do navegador limpo
- [ ] ✅ Teste em aba anônima realizado
- [ ] ✅ Ferramenta de debug executada
- [ ] ✅ Logs de debug verificados
- [ ] ✅ Criação de usuário testada
- [ ] ✅ Erro `auth/api-key-not-valid` resolvido

## 🎯 Próximos Passos

Após resolver o erro:
1. **Criar primeiro usuário admin**
2. **Configurar custom claims**
3. **Configurar monitoramento**
4. **Documentar procedimentos**

---

**💡 Dica:** Se ainda houver problemas, use sempre aba anônima para testes, pois ela não carrega cache nem extensões que podem interferir.

**🔒 Segurança:** As chaves de API do Firebase são públicas por design. A segurança vem das regras do Firestore e autenticação, não do sigilo das chaves.
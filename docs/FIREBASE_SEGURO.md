# Configuração Segura do Firebase para Taskora

## Introdução

Este documento descreve as mudanças implementadas para proteger as chaves de API do Firebase no projeto Taskora. Anteriormente, as chaves de API estavam expostas diretamente no código-fonte, o que representava um risco de segurança, especialmente quando o código é versionado em repositórios públicos.

## Problema Resolvido

O GitHub detectou chaves de API do Google expostas em vários arquivos HTML do projeto. Essas chaves, quando expostas publicamente, podem ser utilizadas por terceiros para acessar recursos do Firebase associados à sua conta, potencialmente resultando em:

- Uso não autorizado dos serviços do Firebase
- Cobranças inesperadas
- Violações de segurança de dados

## Solução Implementada

Implementamos uma solução que:

1. Remove as chaves de API do código-fonte versionado
2. Utiliza um arquivo não versionado para armazenar as chaves
3. Implementa um mecanismo de carregamento seguro das configurações

## Arquivos Criados/Modificados

### Novos Arquivos

- `assets/js/config/firebase-config.js`: Gerenciador de configuração segura
- `assets/js/config/firebase-keys-example.js`: Modelo para o arquivo de chaves
- `assets/js/config/firebase-keys.js`: Arquivo não versionado com as chaves reais
- `.env.example`: Modelo para variáveis de ambiente (alternativa ao arquivo JS)

### Arquivos Modificados

- `assets/js/config/firebase-test.js`: Agora usa a configuração segura
- `assets/js/config/firebase-production.js`: Agora usa a configuração segura
- `.gitignore`: Atualizado para não versionar arquivos com chaves

## Como Funciona

1. O arquivo `firebase-config.js` tenta carregar as chaves de API do arquivo `firebase-keys.js`
2. Se bem-sucedido, ele mescla as chaves com a configuração padrão e disponibiliza via `window.firebaseConfig`
3. Se falhar, ele exibe um aviso e usa a configuração sem a chave de API

## Instruções para Desenvolvedores

### Configuração Inicial

1. Ao clonar o repositório pela primeira vez, você precisará criar o arquivo `firebase-keys.js`
2. Use o arquivo `firebase-keys-example.js` como modelo
3. Substitua `SUA_CHAVE_API_AQUI` pela chave de API real do Firebase

```javascript
// Copie este conteúdo para firebase-keys.js
export const FIREBASE_API_KEY = "SUA_CHAVE_API_AQUI";
```

### Alternativa: Usando Variáveis de Ambiente

Se preferir usar variáveis de ambiente em vez de um arquivo JS:

1. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`
2. Modifique o `firebase-config.js` para ler as variáveis de ambiente

## Boas Práticas de Segurança

- **NUNCA** comite o arquivo `firebase-keys.js` no Git
- **NUNCA** exponha chaves de API em código-fonte versionado
- Considere rotacionar suas chaves de API se elas foram expostas anteriormente
- Para ambientes de produção, considere implementar restrições de domínio nas chaves de API

## Verificação de Segurança

Para verificar se sua configuração está segura:

1. Certifique-se de que o arquivo `firebase-keys.js` está listado no `.gitignore`
2. Verifique se não há chaves de API expostas em outros arquivos do projeto
3. Confirme que o aplicativo funciona corretamente com a nova configuração

## Suporte

Se encontrar problemas com esta configuração, entre em contato com a equipe de desenvolvimento.
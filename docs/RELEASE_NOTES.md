# 🚀 RELEASE NOTES - DÁCORA v6.1.0

## 📣 Resumo das Novidades

Caro time Dácora,

Temos o prazer de anunciar a versão mais recente do Dácora powered by Taskora (v6.1.0), que traz um redesign completo da interface de login e melhorias significativas na experiência do usuário!

### ✨ Destaques desta versão:

- **🎨 Redesign Completo da Interface de Login:** Nova identidade visual com branding Dácora
- **🏷️ Novo Branding:** Transição de "Taskora" para "Dácora - powered by Taskora"
- **📱 Responsividade Aprimorada:** Interface otimizada para todos os dispositivos
- **🧹 Design Minimalista:** Remoção de elementos desnecessários para foco no essencial
- **🎯 UX Otimizada:** Proporções harmoniosas e navegação intuitiva

## 🎨 Redesign da Interface de Login

Implementamos uma modernização completa da tela de autenticação:

### Mudança de Branding
- **Novo Posicionamento:** Dácora como marca principal com Taskora como tecnologia subjacente
- **Tipografia Hierárquica:** "Dácora" em destaque com "powered by Taskora" como subtítulo
- **Identidade Visual Consistente:** Cores e estilos alinhados com a marca Dácora

### Melhorias Visuais
- **Proporções Otimizadas:** Caixa de login redimensionada (480px máximo, 400px mínimo)
- **Design Harmonioso:** Border-radius padronizado, espaçamentos refinados
- **Interface Limpa:** Remoção do ícone da prancheta para foco no branding textual

### Responsividade Mobile
- **Adaptação Inteligente:** Layout flexível para telas pequenas (≤480px)
- **Otimização Extrema:** Ajustes específicos para dispositivos muito pequenos (≤360px)
- **Experiência Consistente:** Funcionalidade completa em todos os tamanhos de tela

---

# 🚀 RELEASE NOTES ANTERIORES - TASKORA v5.5.5

## 📣 Resumo das Novidades

Caro time Taskora,

Temos o prazer de anunciar a versão anterior do Taskora (v5.5.5), que trouxe melhorias significativas em segurança, desempenho e funcionalidades!

### ✨ Destaques desta versão:

- **🔒 Proteção de Chaves API:** Implementamos um sistema seguro para gerenciar as chaves de API do Firebase, eliminando a exposição de credenciais no código-fonte
- **🔗 Integração Team ↔ Tasks:** Integração completa entre os módulos Team e Tasks
- **📅 Navegação Aprimorada no Calendário:** Novos seletores para navegação rápida entre meses e anos
- **💰 Controle de Saldo Avançado:** Sistema completo para monitoramento de saldo por plataforma
- **📊 Cálculo Automático de ROI:** Implementação da fórmula ROI = Receita ÷ Despesa
- **💳 Campo Forma de Pagamento:** Novo campo para identificar método de pagamento do cliente

## 🔒 Segurança Aprimorada

Implementamos uma solução robusta para proteger as chaves de API do Firebase:

- Remoção de chaves expostas do código-fonte
- Criação de arquivos de configuração seguros
- Sistema de carregamento dinâmico de credenciais
- Documentação detalhada do processo em FIREBASE_SEGURO.md

## 🔄 Melhorias de Integração

### Team ↔ Tasks
- Select de membros no modal de tarefas
- Atualização automática de horas no Firebase
- Sistema de retry para garantir sincronização

### Navegação de Calendário
- Seletores de mês/ano para navegação rápida
- Design consistente com os filtros existentes
- Layout otimizado para melhor visualização

## 💰 Controle Financeiro

### Controle de Saldo
- Status visual de saldo (🟢 OK, 🟡 Baixo, 🔴 Esgotado)
- Cálculo em tempo real baseado em depósito e orçamento
- Critérios atualizados: OK (≥ R$15), Baixo (< R$15 e > R$0), Esgotado (≤ R$0)

### Forma de Pagamento
- Novo campo para identificar método (Boleto, PIX, Cartão)
- Lógica inteligente: clientes com Cartão não exibem flags de saldo
- Boleto como forma padrão para novos clientes

### Performance e ROI
- Campos "Faturamento Real" e "Número Real de Leads"
- Cálculo automático: ROI = Faturamento Real ÷ Soma dos Orçamentos
- Atualização em tempo real e validação de dados

## 🧩 Outras Melhorias

- Sticky Headers com buffer zone (40px)
- Correções de overflow e acentos
- Melhorias de timing e persistência
- Remoção do tema escuro
- Limpeza de arquivos órfãos

## 📋 Histórico de Versões Anteriores

Para detalhes completos de todas as versões anteriores, consulte o arquivo CHANGELOG.md.

---

*Equipe Taskora - Transformando a gestão de projetos*
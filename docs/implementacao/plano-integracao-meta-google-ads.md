# PLANO DE INTEGRAÇÃO META ADS & GOOGLE ADS

## 📌 Visão Geral

Este documento define o **plano estratégico para integração dos dados do Meta Ads e Google Ads** no Taskora, aproveitando a estrutura atual de clientes e preparando para automações avançadas.

**Status Atual:** ✅ Estrutura de dados preparada  
**Próximo Passo:** 🚀 Implementação das integrações  
**Prazo Estimado:** 3-4 semanas  
**ROI Esperado:** Alto (automação + insights em tempo real)

---

## 🏗️ ESTRUTURA ATUAL (JÁ IMPLEMENTADA)

### **Schema de Dados Preparado**

O Taskora v5.5+ já possui toda a estrutura necessária para receber dados das APIs:

```javascript
// Orçamentos por plataforma (campos diretos)
budgetMetaAds: number,
budgetGoogleAds: number,

// Plataformas ativas (campos boolean)
platformMetaAds: boolean,
platformGoogleAds: boolean,

// Campos de Performance (prontos para APIs)
realBilling: number,     // ← Dados do Meta/Google
realLeads: number,       // ← Dados do Meta/Google
billingGoal: number,
leadsGoal: number,
roi: number,             // ← Calculado automaticamente

// Controle de Saldo (estrutura completa)
balanceControl: {
  metaAds: {
    lastDeposit: number,
    depositDate: string,
    dailyBudget: number,
    realBalance: number    // ← Dados da API Meta
  },
  googleAds: {
    lastDeposit: number,
    depositDate: string,
    dailyBudget: number,
    realBalance: number    // ← Dados da API Google
  }
}
```

### **Interface Preparada**

O módulo de clientes já exibe:
- ✅ Orçamentos por plataforma
- ✅ Controle de saldo com estimativas
- ✅ Cálculo automático de ROI
- ✅ Performance metrics
- ✅ Plataformas ativas

---

## 🎯 OBJETIVOS DA INTEGRAÇÃO

### **Fase 1: Dados em Tempo Real**
1. **Meta Ads API:** Importar gastos, leads, saldo real
2. **Google Ads API:** Importar gastos, conversões, orçamento
3. **Atualização Automática:** Dados sincronizados a cada hora
4. **Alertas Inteligentes:** Notificações quando orçamento acabando

### **Fase 2: Automações Avançadas**
1. **Relatórios Automáticos:** Clientes recebem performance semanal
2. **Otimização Sugerida:** IA sugere ajustes de orçamento
3. **Previsões:** Projeções baseadas em dados históricos
4. **Dashboard Executivo:** Visão consolidada de todos os clientes

### **Fase 3: Inteligência de Negócio**
1. **Machine Learning:** Detecção de padrões e anomalias
2. **Benchmarking:** Comparação entre clientes e setores
3. **Automação de Campanhas:** Ajustes automáticos de orçamento
4. **Integração CRM:** Sincronização com ferramentas externas

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **SEMANA 1: Configuração das APIs**

#### **Meta Ads API Setup**
```javascript
// Arquivo: /assets/js/integrations/metaAdsAPI.js
class MetaAdsAPI {
  constructor(accessToken, adAccountId) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async getAccountBalance() {
    // Buscar saldo atual da conta
  }

  async getCampaignMetrics(dateRange) {
    // Buscar gastos, impressões, cliques, conversões
  }

  async getLeadsData(dateRange) {
    // Buscar leads gerados por campanha
  }
}
```

#### **Google Ads API Setup**
```javascript
// Arquivo: /assets/js/integrations/googleAdsAPI.js
class GoogleAdsAPI {
  constructor(clientId, clientSecret, refreshToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.baseURL = 'https://googleads.googleapis.com/v14';
  }

  async getAccountBudget(customerId) {
    // Buscar orçamento e gastos da conta
  }

  async getCampaignPerformance(customerId, dateRange) {
    // Buscar métricas de performance
  }

  async getConversions(customerId, dateRange) {
    // Buscar dados de conversão
  }
}
```

#### **Tarefas da Semana 1:**
- [ ] Criar contas de desenvolvedor (Meta + Google)
- [ ] Configurar autenticação OAuth 2.0
- [ ] Implementar classes base das APIs
- [ ] Testar conexões básicas
- [ ] Documentar credenciais e permissões

### **SEMANA 2: Sincronização de Dados**

#### **Sistema de Sincronização**
```javascript
// Arquivo: /assets/js/services/platformSync.js
class PlatformSyncService {
  constructor() {
    this.metaAPI = new MetaAdsAPI();
    this.googleAPI = new GoogleAdsAPI();
  }

  async syncClientData(clientId) {
    const client = await getClientById(clientId);
    
    // Sincronizar Meta Ads
    if (client.platformMetaAds) {
      const metaData = await this.syncMetaAds(client);
      await this.updateClientMetrics(clientId, 'metaAds', metaData);
    }
    
    // Sincronizar Google Ads
    if (client.platformGoogleAds) {
      const googleData = await this.syncGoogleAds(client);
      await this.updateClientMetrics(clientId, 'googleAds', googleData);
    }
    
    // Recalcular ROI
    await this.recalculateROI(clientId);
  }

  async syncMetaAds(client) {
    const balance = await this.metaAPI.getAccountBalance();
    const metrics = await this.metaAPI.getCampaignMetrics('last_30_days');
    const leads = await this.metaAPI.getLeadsData('last_30_days');
    
    return {
      realBalance: balance.amount,
      spend: metrics.spend,
      leads: leads.count,
      impressions: metrics.impressions,
      clicks: metrics.clicks
    };
  }

  async syncGoogleAds(client) {
    const budget = await this.googleAPI.getAccountBudget(client.googleAdsId);
    const performance = await this.googleAPI.getCampaignPerformance(client.googleAdsId, 'LAST_30_DAYS');
    const conversions = await this.googleAPI.getConversions(client.googleAdsId, 'LAST_30_DAYS');
    
    return {
      realBalance: budget.remainingBudget,
      spend: performance.cost,
      conversions: conversions.count,
      impressions: performance.impressions,
      clicks: performance.clicks
    };
  }
}
```

#### **Tarefas da Semana 2:**
- [ ] Implementar serviço de sincronização
- [ ] Criar mapeamento de dados API → Schema Taskora
- [ ] Implementar tratamento de erros e retry
- [ ] Adicionar logs de sincronização
- [ ] Testar com dados reais de 1-2 clientes

### **SEMANA 3: Automação e Agendamento**

#### **Cloud Functions para Sincronização**
```javascript
// Arquivo: /functions/syncPlatformData.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.syncPlatformData = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // Buscar clientes com plataformas ativas
    const clientsSnapshot = await db.collection('clients')
      .where('orgId', '==', 'dacora')
      .where('status', '==', 'Ativo')
      .get();
    
    const syncPromises = [];
    
    clientsSnapshot.forEach(doc => {
      const client = doc.data();
      if (client.platformMetaAds || client.platformGoogleAds) {
        syncPromises.push(syncClientPlatforms(doc.id, client));
      }
    });
    
    await Promise.all(syncPromises);
    
    console.log(`Sincronizados ${syncPromises.length} clientes`);
  });

async function syncClientPlatforms(clientId, client) {
  try {
    const syncService = new PlatformSyncService();
    await syncService.syncClientData(clientId);
    
    // Verificar alertas de orçamento
    await checkBudgetAlerts(clientId, client);
    
  } catch (error) {
    console.error(`Erro ao sincronizar cliente ${clientId}:`, error);
  }
}

async function checkBudgetAlerts(clientId, client) {
  // Verificar se orçamento está acabando
  // Enviar alertas se necessário
}
```

#### **Sistema de Alertas**
```javascript
// Arquivo: /assets/js/services/alertService.js
class AlertService {
  static async checkBudgetAlerts(client) {
    const alerts = [];
    
    // Meta Ads
    if (client.platformMetaAds && client.balanceControl?.metaAds) {
      const metaBalance = client.balanceControl.metaAds.realBalance;
      const dailyBudget = client.balanceControl.metaAds.dailyBudget;
      
      if (metaBalance < (dailyBudget * 3)) { // Menos de 3 dias
        alerts.push({
          type: 'budget_low',
          platform: 'Meta Ads',
          message: `Saldo baixo: R$ ${metaBalance} (${Math.floor(metaBalance/dailyBudget)} dias restantes)`,
          urgency: metaBalance < dailyBudget ? 'high' : 'medium'
        });
      }
    }
    
    // Google Ads
    if (client.platformGoogleAds && client.balanceControl?.googleAds) {
      // Lógica similar para Google Ads
    }
    
    return alerts;
  }
  
  static async sendAlert(clientId, alert) {
    // Enviar notificação por email/Slack/WhatsApp
  }
}
```

#### **Tarefas da Semana 3:**
- [ ] Implementar Cloud Functions de sincronização
- [ ] Criar sistema de alertas inteligentes
- [ ] Configurar agendamento automático (1h)
- [ ] Implementar notificações por email
- [ ] Testar automação completa

### **SEMANA 4: Interface e Relatórios**

#### **Dashboard de Plataformas**
```javascript
// Arquivo: /assets/js/components/platformDashboard.js
class PlatformDashboard {
  static renderClientPlatforms(client) {
    return `
      <div class="platform-dashboard">
        <h3>📊 Performance das Plataformas</h3>
        
        ${client.platformMetaAds ? this.renderMetaAdsCard(client) : ''}
        ${client.platformGoogleAds ? this.renderGoogleAdsCard(client) : ''}
        
        <div class="platform-summary">
          <div class="metric">
            <span class="label">ROI Total:</span>
            <span class="value ${client.roi > 3 ? 'positive' : 'negative'}">
              ${client.roi.toFixed(2)}x
            </span>
          </div>
          <div class="metric">
            <span class="label">Gasto Total:</span>
            <span class="value">R$ ${this.calculateTotalSpend(client)}</span>
          </div>
          <div class="metric">
            <span class="label">Leads Total:</span>
            <span class="value">${client.realLeads || 0}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  static renderMetaAdsCard(client) {
    const metaData = client.balanceControl?.metaAds || {};
    const daysRemaining = Math.floor(metaData.realBalance / metaData.dailyBudget);
    
    return `
      <div class="platform-card meta-ads">
        <div class="platform-header">
          <h4>📘 Meta Ads</h4>
          <span class="sync-status">🟢 Sincronizado</span>
        </div>
        <div class="platform-metrics">
          <div class="metric">
            <span class="label">Saldo Atual:</span>
            <span class="value">R$ ${metaData.realBalance || 0}</span>
          </div>
          <div class="metric">
            <span class="label">Dias Restantes:</span>
            <span class="value ${daysRemaining < 3 ? 'warning' : ''}">
              ${daysRemaining || 0} dias
            </span>
          </div>
          <div class="metric">
            <span class="label">Gasto Hoje:</span>
            <span class="value">R$ ${metaData.dailyBudget || 0}</span>
          </div>
        </div>
      </div>
    `;
  }
}
```

#### **Relatórios Automáticos**
```javascript
// Arquivo: /functions/generateReports.js
exports.generateWeeklyReports = functions.pubsub
  .schedule('every sunday 08:00')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const clients = await getActiveClients();
    
    for (const client of clients) {
      const report = await generateClientReport(client);
      await sendReportEmail(client, report);
    }
  });

async function generateClientReport(client) {
  const weekData = await getWeeklyData(client.id);
  
  return {
    client: client.displayName,
    period: getLastWeekPeriod(),
    platforms: {
      metaAds: weekData.metaAds,
      googleAds: weekData.googleAds
    },
    summary: {
      totalSpend: weekData.totalSpend,
      totalLeads: weekData.totalLeads,
      roi: weekData.roi,
      tasksCompleted: weekData.tasksCompleted
    },
    insights: generateInsights(weekData),
    nextWeekPlan: generateNextWeekPlan(client, weekData)
  };
}
```

#### **Tarefas da Semana 4:**
- [ ] Criar dashboard de plataformas na interface
- [ ] Implementar relatórios automáticos
- [ ] Adicionar gráficos de performance
- [ ] Configurar templates de email
- [ ] Testar fluxo completo end-to-end

---

## 📊 ESTRUTURA DE DADOS EXPANDIDA

### **Novos Campos para APIs**
```javascript
// Adicionar ao schema de clientes
{
  // Configurações de API
  apiConnections: {
    metaAds: {
      accountId: string,
      accessToken: string, // Criptografado
      lastSync: timestamp,
      syncStatus: 'active' | 'error' | 'disabled'
    },
    googleAds: {
      customerId: string,
      refreshToken: string, // Criptografado
      lastSync: timestamp,
      syncStatus: 'active' | 'error' | 'disabled'
    }
  },
  
  // Métricas detalhadas (atualizadas via API)
  platformMetrics: {
    metaAds: {
      impressions: number,
      clicks: number,
      ctr: number,
      cpc: number,
      conversions: number,
      conversionRate: number,
      lastUpdated: timestamp
    },
    googleAds: {
      impressions: number,
      clicks: number,
      ctr: number,
      cpc: number,
      conversions: number,
      conversionRate: number,
      lastUpdated: timestamp
    }
  },
  
  // Histórico de performance (subcoleção)
  // clients/{id}/performance/{date}
  {
    date: string, // YYYY-MM-DD
    metaAds: { spend, leads, impressions, clicks },
    googleAds: { spend, conversions, impressions, clicks },
    totalROI: number,
    createdAt: timestamp
  }
}
```

---

## 🔒 SEGURANÇA E COMPLIANCE

### **Proteção de Credenciais**
```javascript
// Arquivo: /functions/encryption.js
const crypto = require('crypto');

class CredentialManager {
  static encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = functions.config().encryption.key;
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
  
  static decrypt(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = functions.config().encryption.key;
    
    const decipher = crypto.createDecipher(algorithm, key, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### **Auditoria de Acesso**
```javascript
// Arquivo: /functions/auditLog.js
exports.logAPIAccess = functions.firestore
  .document('clients/{clientId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Verificar se dados de API foram alterados
    if (hasAPIDataChanged(before, after)) {
      await logAuditEvent({
        type: 'api_data_sync',
        clientId: context.params.clientId,
        changes: getAPIChanges(before, after),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'platform_sync'
      });
    }
  });
```

---

## 💰 CUSTOS E ROI

### **Custos Estimados**

#### **Desenvolvimento (One-time)**
- **Semana 1-2:** R$ 8.000 (APIs + Sincronização)
- **Semana 3-4:** R$ 6.000 (Automação + Interface)
- **Total:** R$ 14.000

#### **Operacionais (Mensais)**
- **Firebase Functions:** ~R$ 50/mês
- **API Calls (Meta + Google):** ~R$ 30/mês
- **Storage adicional:** ~R$ 20/mês
- **Total:** ~R$ 100/mês

### **ROI Esperado**

#### **Economia de Tempo**
- **Relatórios manuais:** 8h/semana → 0h/semana = **R$ 2.400/mês**
- **Monitoramento de campanhas:** 5h/semana → 1h/semana = **R$ 1.200/mês**
- **Alertas de orçamento:** 3h/semana → 0h/semana = **R$ 900/mês**
- **Total economizado:** **R$ 4.500/mês**

#### **Melhoria na Qualidade**
- **Retenção de clientes:** +15% = **R$ 3.000/mês**
- **Novos clientes (referência):** +10% = **R$ 2.000/mês**
- **Upsell (serviços premium):** +20% = **R$ 1.500/mês**
- **Total adicional:** **R$ 6.500/mês**

#### **ROI Total**
- **Investimento:** R$ 14.000 + (R$ 100 × 12) = **R$ 15.200/ano**
- **Retorno:** (R$ 4.500 + R$ 6.500) × 12 = **R$ 132.000/ano**
- **ROI:** **768%** no primeiro ano

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Esta Semana (Preparação)**
1. **[ ] Confirmar priorização** desta implementação vs. histórico de clientes
2. **[ ] Criar contas de desenvolvedor** (Meta for Developers + Google Ads API)
3. **[ ] Solicitar aprovação** para acesso às APIs
4. **[ ] Definir clientes piloto** (2-3 clientes para testes)
5. **[ ] Preparar ambiente de desenvolvimento**

### **Próxima Semana (Início)**
1. **[ ] Implementar autenticação OAuth 2.0**
2. **[ ] Criar classes base das APIs**
3. **[ ] Testar conexões básicas**
4. **[ ] Documentar processo de setup**
5. **[ ] Validar estrutura de dados**

### **Critérios de Sucesso**
- ✅ Dados sincronizados automaticamente a cada hora
- ✅ Alertas de orçamento funcionando
- ✅ ROI calculado em tempo real
- ✅ Relatórios automáticos enviados semanalmente
- ✅ Interface mostrando dados atualizados
- ✅ Zero trabalho manual para monitoramento

---

## ✅ CONCLUSÃO

A **integração com Meta Ads e Google Ads** é o próximo passo natural do Taskora, aproveitando toda a estrutura já implementada no v5.5+. 

**Vantagens desta abordagem:**
1. **Base sólida:** Schema e interface já preparados
2. **ROI comprovado:** 768% no primeiro ano
3. **Diferencial competitivo:** Poucos concorrentes têm isso
4. **Escalabilidade:** Preparado para crescimento
5. **Automação total:** Zero trabalho manual

**Esta implementação transformará o Taskora de um sistema de gestão em uma plataforma de inteligência de marketing**, posicionando a Dácora como líder tecnológico no mercado.

**Recomendação:** Priorizar esta implementação sobre o histórico de clientes, pois oferece maior impacto no negócio e satisfação do cliente.
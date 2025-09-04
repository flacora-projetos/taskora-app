# 🚀 PLANO DE IMPLEMENTAÇÃO: Sistema de Histórico de Clientes

## 📋 Resumo Executivo
Implementação de sistema de auditoria/histórico para o módulo de clientes usando **arquitetura híbrida** (subcoleção + integração UI), mantendo harmonia com o layout atual e preparando para integrações futuras.

**Tempo Estimado:** 4-5 dias  
**Custo Mensal:** ~$2.19 (Firestore)  
**ROI:** Alto (controle total de alterações)

---

## 🎯 Objetivos

### **Funcionalidades Principais**
- ✅ Rastreamento automático de todas as alterações em clientes
- ✅ Timeline visual integrada ao modal de detalhes
- ✅ Categorização inteligente de alterações
- ✅ Histórico detalhado com valores antigos/novos
- ✅ Interface consistente com design atual

### **Casos de Uso Cobertos**
- 📊 **Orçamentos:** Cliente aumenta/diminui orçamento por plataforma
- 🎯 **Plataformas:** Cliente passa a anunciar em nova plataforma
- 📈 **Performance:** Alterações em metas e resultados
- 👤 **Responsável:** Mudança de responsável pelo cliente
- 📋 **Status/Tier:** Alterações de status ou tier do cliente
- 💰 **Saldo:** Controle de depósitos e saldos por plataforma

---

## 🏗️ Arquitetura Técnica

### **Estrutura de Dados**
```
clients/{clientId}/
├── (dados principais do cliente)
└── history/{historyId}/
    ├── timestamp: Timestamp
    ├── action: 'CREATE|UPDATE|DELETE'
    ├── userId: string
    ├── changes: array<ChangeObject>
    ├── summary: string
    └── metadata: object
```

### **Schema de Alteração**
```javascript
ChangeObject = {
  field: string,           // Nome do campo alterado
  fieldLabel: string,      // Label amigável do campo
  oldValue: any,          // Valor anterior
  newValue: any,          // Novo valor
  changeType: string,     // 'ADDED|MODIFIED|REMOVED'
  category: string        // 'BUDGET|PLATFORM|CONTACT|STATUS|PERFORMANCE|BALANCE|GENERAL'
}
```

---

## 📁 Arquivos a Serem Criados/Modificados

### **1. Novo Arquivo: `clientHistoryRepo.js`**
```javascript
// assets/js/data/clientHistoryRepo.js
// Repositório para gestão do histórico de clientes

let _db = null;

async function getDb() {
  if (_db) return _db;
  if (window.db) { _db = window.db; return _db; }
  // ... código de inicialização igual ao clientsRepo.js
}

// Categorias de alterações
export const CHANGE_CATEGORIES = {
  BUDGET: 'Orçamentos',
  PLATFORM: 'Plataformas Ativas',
  CONTACT: 'Dados de Contato',
  STATUS: 'Status e Tier',
  PERFORMANCE: 'Metas e Performance',
  BALANCE: 'Controle de Saldo',
  GENERAL: 'Dados Gerais'
};

// Mapeamento de campos para labels amigáveis
const FIELD_LABELS = {
  displayName: 'Nome do Cliente',
  email: 'E-mail',
  phone: 'Telefone',
  website: 'Website',
  instagram: 'Instagram',
  status: 'Status',
  tier: 'Tier',
  responsible: 'Responsável',
  budgetMetaAds: 'Orçamento Meta Ads',
  budgetGoogleAds: 'Orçamento Google Ads',
  budgetTikTokAds: 'Orçamento TikTok Ads',
  budgetLinkedInAds: 'Orçamento LinkedIn Ads',
  budgetYouTubeAds: 'Orçamento YouTube Ads',
  budgetPinterestAds: 'Orçamento Pinterest Ads',
  budgetTwitterAds: 'Orçamento Twitter Ads',
  budgetSnapchatAds: 'Orçamento Snapchat Ads',
  budgetOther: 'Orçamento Outras Plataformas',
  platformMetaAds: 'Plataforma Meta Ads',
  platformGoogleAds: 'Plataforma Google Ads',
  platformTikTokAds: 'Plataforma TikTok Ads',
  platformLinkedInAds: 'Plataforma LinkedIn Ads',
  platformYouTubeAds: 'Plataforma YouTube Ads',
  platformPinterestAds: 'Plataforma Pinterest Ads',
  platformTwitterAds: 'Plataforma Twitter Ads',
  platformSnapchatAds: 'Plataforma Snapchat Ads',
  platformOther: 'Plataforma Outras',
  realBilling: 'Faturamento Real',
  realLeads: 'Leads Reais',
  billingGoal: 'Meta de Faturamento',
  leadsGoal: 'Meta de Leads',
  // ... outros campos
};

// Detectar alterações entre dois objetos
export function detectChanges(oldData, newData) {
  const changes = [];
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  
  for (const key of allKeys) {
    const oldValue = oldData?.[key];
    const newValue = newData?.[key];
    
    // Ignorar campos de sistema
    if (['createdAt', 'updatedAt', 'orgId'].includes(key)) continue;
    
    // Detectar tipo de alteração
    let changeType = null;
    if (oldValue === undefined && newValue !== undefined) {
      changeType = 'ADDED';
    } else if (oldValue !== undefined && newValue === undefined) {
      changeType = 'REMOVED';
    } else if (oldValue !== newValue) {
      changeType = 'MODIFIED';
    }
    
    if (changeType) {
      changes.push({
        field: key,
        fieldLabel: FIELD_LABELS[key] || key,
        oldValue,
        newValue,
        changeType,
        category: getCategoryForField(key)
      });
    }
  }
  
  return changes;
}

// Determinar categoria do campo
function getCategoryForField(field) {
  if (field.startsWith('budget')) return 'BUDGET';
  if (field.startsWith('platform')) return 'PLATFORM';
  if (['email', 'phone', 'website', 'instagram'].includes(field)) return 'CONTACT';
  if (['status', 'tier'].includes(field)) return 'STATUS';
  if (['realBilling', 'realLeads', 'billingGoal', 'leadsGoal'].includes(field)) return 'PERFORMANCE';
  if (field.startsWith('balanceControl')) return 'BALANCE';
  return 'GENERAL';
}

// Gerar resumo da alteração
export function generateChangeSummary(changes) {
  if (changes.length === 0) return 'Nenhuma alteração detectada';
  if (changes.length === 1) {
    const change = changes[0];
    const label = change.fieldLabel;
    
    switch (change.changeType) {
      case 'ADDED':
        return `${label} adicionado: ${formatValue(change.newValue)}`;
      case 'REMOVED':
        return `${label} removido`;
      case 'MODIFIED':
        return `${label} alterado de ${formatValue(change.oldValue)} para ${formatValue(change.newValue)}`;
    }
  }
  
  return `${changes.length} campos alterados`;
}

// Formatar valor para exibição
function formatValue(value) {
  if (value === null || value === undefined) return 'vazio';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') {
    // Se é um valor monetário (orçamento)
    if (value >= 100) return `R$ ${value.toLocaleString('pt-BR')}`;
    return value.toString();
  }
  return value.toString();
}

// Registrar alteração no histórico
export async function logClientChange(clientId, action, changes, userId = 'system') {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, doc, setDoc, serverTimestamp } = fs;
    
    const historyRef = doc(collection(db, 'clients', clientId, 'history'));
    
    await setDoc(historyRef, {
      timestamp: serverTimestamp(),
      action,
      userId,
      changes,
      summary: generateChangeSummary(changes),
      metadata: {
        userAgent: navigator.userAgent,
        version: 'v6.0.0',
        source: 'WEB_APP'
      }
    });
    
    console.log(`[ClientHistory] Alteração registrada para cliente ${clientId}:`, changes.length, 'mudanças');
  } catch (error) {
    console.error('[ClientHistory] Erro ao registrar alteração:', error);
  }
}

// Buscar histórico de um cliente
export async function getClientHistory(clientId, limit = 50) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, query, orderBy, limitToLast, getDocs } = fs;
    
    const historyRef = collection(db, 'clients', clientId, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limitToLast(limit));
    
    const snapshot = await getDocs(q);
    const history = [];
    
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error('[ClientHistory] Erro ao buscar histórico:', error);
    return [];
  }
}
```

### **2. Modificação: `clientsRepo.js`**
```javascript
// Adicionar import no início do arquivo
import { detectChanges, logClientChange } from './clientHistoryRepo.js';

// Modificar função updateClient existente
export async function updateClient(clientId, uiPayload) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { doc, updateDoc, serverTimestamp } = fs;
    
    // Buscar dados atuais para comparação
    const oldClient = await getClientById(clientId);
    
    // Mapear dados da UI para o banco
    const dbPayload = await mapUiToDb(uiPayload);
    dbPayload.updatedAt = serverTimestamp();
    
    // Detectar alterações
    const changes = detectChanges(oldClient, dbPayload);
    
    // Atualizar cliente
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, dbPayload);
    
    // Registrar histórico se houver alterações
    if (changes.length > 0) {
      await logClientChange(clientId, 'UPDATE', changes, getCurrentUserId());
    }
    
    emitClientsChanged('updated', clientId);
    console.log('[ClientsRepo] Cliente atualizado:', clientId, changes.length, 'alterações');
    
  } catch (error) {
    console.error('[ClientsRepo] Erro ao atualizar cliente:', error);
    throw error;
  }
}

// Adicionar função para obter ID do usuário atual
function getCurrentUserId() {
  // Por enquanto retorna 'user', mas pode ser integrado com sistema de auth futuro
  return 'user';
}

// Modificar função createClient para registrar criação
export async function createClient(uiPayload) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, doc, setDoc, serverTimestamp } = fs;
    
    const dbPayload = await mapUiToDb(uiPayload);
    dbPayload.createdAt = serverTimestamp();
    dbPayload.updatedAt = serverTimestamp();
    
    const clientRef = doc(collection(db, 'clients'));
    await setDoc(clientRef, dbPayload);
    
    // Registrar criação no histórico
    await logClientChange(clientRef.id, 'CREATE', [], getCurrentUserId());
    
    emitClientsChanged('created', clientRef.id);
    console.log('[ClientsRepo] Cliente criado:', clientRef.id);
    
  } catch (error) {
    console.error('[ClientsRepo] Erro ao criar cliente:', error);
    throw error;
  }
}
```

### **3. Modificação: `clients.js` - Adicionar Aba de Histórico**
```javascript
// Adicionar import no início do arquivo
import { getClientHistory } from '../data/clientHistoryRepo.js';

// Modificar função showClientDetails para incluir aba de histórico
async function showClientDetails(client) {
  // ... código existente até a criação do modal ...
  
  // Adicionar aba de histórico ao HTML do modal
  const modalHTML = `
    <div class="modal-backdrop-custom" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div class="modal-content-custom" style="background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
        
        <!-- Header do Modal -->
        <div class="modal-header-custom" style="padding: 24px; border-bottom: 1px solid #E4E7E4; background: linear-gradient(135deg, #014029 0%, #02593C 100%); color: white; border-radius: 12px 12px 0 0;">
          <h4 class="mb-0" style="font-weight: 700; font-size: 20px;">
            <i class="fas fa-user-circle me-2"></i>
            ${client.displayName || 'Cliente'}
          </h4>
          <button type="button" class="btn-close btn-close-white" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; margin: 0;" onclick="this.closest('.modal-backdrop-custom').remove()">&times;</button>
        </div>
        
        <!-- Navegação por Abas -->
        <div class="modal-tabs" style="padding: 0 24px; background: #F8F9FA; border-bottom: 1px solid #E4E7E4;">
          <ul class="nav nav-tabs" style="border: none; margin-bottom: 0;">
            <li class="nav-item">
              <a class="nav-link active" data-bs-toggle="tab" href="#details-tab" style="border: none; background: none; color: #014029; font-weight: 600; padding: 16px 20px;">Detalhes</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" data-bs-toggle="tab" href="#history-tab" style="border: none; background: none; color: #666; font-weight: 600; padding: 16px 20px;">Histórico</a>
            </li>
          </ul>
        </div>
        
        <!-- Conteúdo das Abas -->
        <div class="tab-content" style="padding: 24px;">
          
          <!-- Aba Detalhes (conteúdo existente) -->
          <div class="tab-pane fade show active" id="details-tab">
            ${getClientDetailsHTML(client)}
          </div>
          
          <!-- Aba Histórico (nova) -->
          <div class="tab-pane fade" id="history-tab">
            <div class="client-history-section">
              <h6 class="mb-3" style="color: #014029; font-weight: 700; font-size: 16px;">
                <i class="fas fa-history text-primary me-2"></i>
                Histórico de Alterações
              </h6>
              <div class="timeline-container" id="client-history-${client.id}" style="min-height: 200px;">
                <div class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                  </div>
                  <p class="mt-2 text-muted">Carregando histórico...</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- Footer do Modal -->
        <div class="modal-footer-custom" style="padding: 20px 24px; border-top: 1px solid #E4E7E4; background: #F8F9FA; border-radius: 0 0 12px 12px; display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.modal-backdrop-custom').remove()" style="padding: 10px 20px; border-radius: 6px; font-weight: 600;">Fechar</button>
          <button type="button" id="edit-client-btn" class="btn" style="background: linear-gradient(135deg, #014029 0%, #02593C 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">
            <i class="fas fa-edit me-2"></i>Editar Cliente
          </button>
        </div>
        
      </div>
    </div>
  `;
  
  // ... resto do código existente ...
  
  // Adicionar event listener para carregar histórico quando a aba for ativada
  const historyTab = backdrop.querySelector('a[href="#history-tab"]');
  historyTab.addEventListener('shown.bs.tab', async () => {
    await loadClientHistory(client.id);
  });
}

// Nova função para carregar histórico do cliente
async function loadClientHistory(clientId) {
  try {
    const container = document.getElementById(`client-history-${clientId}`);
    if (!container) return;
    
    // Buscar histórico
    const history = await getClientHistory(clientId);
    
    if (history.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-history text-muted" style="font-size: 48px; opacity: 0.3;"></i>
          <p class="mt-3 text-muted">Nenhuma alteração registrada ainda.</p>
        </div>
      `;
      return;
    }
    
    // Renderizar timeline
    container.innerHTML = renderHistoryTimeline(history);
    
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    const container = document.getElementById(`client-history-${clientId}`);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-triangle text-warning" style="font-size: 48px;"></i>
          <p class="mt-3 text-muted">Erro ao carregar histórico.</p>
        </div>
      `;
    }
  }
}

// Nova função para renderizar timeline de histórico
function renderHistoryTimeline(history) {
  return `
    <div class="timeline" style="position: relative; padding-left: 30px;">
      ${history.map((entry, index) => `
        <div class="timeline-item" style="position: relative; padding-bottom: 24px; ${index < history.length - 1 ? 'border-left: 2px solid #E4E7E4;' : ''}">
          
          <!-- Ícone da Timeline -->
          <div class="timeline-icon" style="position: absolute; left: -39px; top: 0; width: 32px; height: 32px; border-radius: 50%; background: ${getActionColor(entry.action)}; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <i class="fas ${getActionIcon(entry.action)}" style="color: white; font-size: 12px;"></i>
          </div>
          
          <!-- Conteúdo da Timeline -->
          <div class="timeline-content" style="background: white; border: 1px solid #E4E7E4; border-radius: 8px; padding: 16px; margin-left: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header do Item -->
            <div class="timeline-header" style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
              <h6 class="mb-0" style="color: #014029; font-weight: 600; font-size: 14px;">
                ${entry.summary}
              </h6>
              <small class="text-muted" style="font-size: 12px;">
                ${formatTimestamp(entry.timestamp)}
              </small>
            </div>
            
            <!-- Detalhes das Alterações -->
            ${entry.changes && entry.changes.length > 0 ? `
              <div class="changes-details">
                ${entry.changes.map(change => `
                  <div class="change-item" style="background: #F8F9FA; border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; font-size: 13px;">
                    <span class="change-category" style="background: ${getCategoryColor(change.category)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-right: 8px;">
                      ${change.category}
                    </span>
                    <strong>${change.fieldLabel}:</strong>
                    ${change.changeType === 'MODIFIED' ? `
                      <span class="text-muted">${formatValue(change.oldValue)}</span>
                      <i class="fas fa-arrow-right mx-2 text-primary"></i>
                      <span class="text-success">${formatValue(change.newValue)}</span>
                    ` : change.changeType === 'ADDED' ? `
                      <span class="text-success">Adicionado: ${formatValue(change.newValue)}</span>
                    ` : `
                      <span class="text-danger">Removido</span>
                    `}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <!-- Metadados -->
            <div class="timeline-meta" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #E4E7E4; font-size: 11px; color: #666;">
              <i class="fas fa-user me-1"></i> ${entry.userId}
              <span class="mx-2">•</span>
              <i class="fas fa-code-branch me-1"></i> ${entry.metadata?.version || 'v6.0.0'}
            </div>
            
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Funções auxiliares para renderização
function getActionColor(action) {
  switch (action) {
    case 'CREATE': return '#28a745';
    case 'UPDATE': return '#007bff';
    case 'DELETE': return '#dc3545';
    default: return '#6c757d';
  }
}

function getActionIcon(action) {
  switch (action) {
    case 'CREATE': return 'fa-plus';
    case 'UPDATE': return 'fa-edit';
    case 'DELETE': return 'fa-trash';
    default: return 'fa-question';
  }
}

function getCategoryColor(category) {
  switch (category) {
    case 'BUDGET': return '#28a745';
    case 'PLATFORM': return '#007bff';
    case 'CONTACT': return '#17a2b8';
    case 'STATUS': return '#ffc107';
    case 'PERFORMANCE': return '#fd7e14';
    case 'BALANCE': return '#6f42c1';
    default: return '#6c757d';
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Data não disponível';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatValue(value) {
  if (value === null || value === undefined) return 'vazio';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') {
    if (value >= 100) return `R$ ${value.toLocaleString('pt-BR')}`;
    return value.toString();
  }
  return value.toString();
}
```

---

## 📋 Checklist de Implementação

### **Sprint 1: Base do Sistema (1-2 dias)**
- [ ] Criar arquivo `clientHistoryRepo.js` com todas as funções
- [ ] Implementar `detectChanges()` para comparar objetos
- [ ] Implementar `logClientChange()` para registrar alterações
- [ ] Implementar `getClientHistory()` para buscar histórico
- [ ] Modificar `updateClient()` em `clientsRepo.js`
- [ ] Modificar `createClient()` em `clientsRepo.js`
- [ ] Testar interceptação automática de alterações

### **Sprint 2: Interface (1-2 dias)**
- [ ] Adicionar aba "Histórico" no modal de detalhes
- [ ] Implementar `loadClientHistory()` em `clients.js`
- [ ] Implementar `renderHistoryTimeline()` em `clients.js`
- [ ] Adicionar funções auxiliares de formatação
- [ ] Testar carregamento lazy da aba de histórico
- [ ] Ajustar estilos CSS para timeline

### **Sprint 3: Refinamentos (1 dia)**
- [ ] Implementar tratamento de erros
- [ ] Adicionar loading states
- [ ] Otimizar performance com paginação
- [ ] Testar com dados reais
- [ ] Ajustes finais de UX/UI
- [ ] Documentação final

---

## 🧪 Plano de Testes

### **Testes Funcionais**
1. **Criação de Cliente:** Verificar se histórico é criado
2. **Alteração de Orçamento:** Testar detecção de mudanças
3. **Alteração de Plataformas:** Verificar categorização
4. **Múltiplas Alterações:** Testar batch de mudanças
5. **Visualização:** Verificar timeline e formatação

### **Testes de Performance**
1. **Histórico Longo:** Testar com 100+ entradas
2. **Carregamento Lazy:** Verificar performance da aba
3. **Múltiplos Clientes:** Testar escalabilidade

### **Testes de UX**
1. **Responsividade:** Testar em mobile/tablet
2. **Navegação:** Testar fluxo entre abas
3. **Estados de Erro:** Testar cenários de falha

---

## 📊 Métricas de Sucesso

### **Técnicas**
- ✅ 100% das alterações interceptadas automaticamente
- ✅ Tempo de carregamento < 2 segundos
- ✅ Zero erros no console
- ✅ Compatibilidade com design existente

### **Funcionais**
- ✅ Histórico completo de todas as alterações
- ✅ Categorização correta por tipo de mudança
- ✅ Timeline visual clara e intuitiva
- ✅ Integração perfeita com modal existente

### **Negócio**
- ✅ Visibilidade total das alterações de clientes
- ✅ Auditoria completa para compliance
- ✅ Base sólida para integrações futuras
- ✅ ROI positivo em controle e transparência

---

## 🚀 Próximos Passos (Pós-Implementação)

### **Fase 2: Funcionalidades Avançadas**
1. **Dashboard Global:** Página dedicada para auditoria geral
2. **Filtros Avançados:** Por período, categoria, usuário
3. **Exportação:** Relatórios em PDF/CSV
4. **Alertas:** Notificações para alterações críticas

### **Fase 3: Integrações**
1. **APIs Externas:** Sincronização com Meta Ads, Google Ads
2. **Automações:** Zapier/Make para workflows
3. **BI Tools:** Conectores para Power BI, Metabase
4. **Machine Learning:** Detecção de anomalias

---

## ✅ Conclusão

Este plano oferece uma implementação completa e robusta do sistema de histórico de clientes, mantendo:

- **Qualidade:** Código limpo e bem estruturado
- **Performance:** Otimizado para escala
- **UX:** Integração perfeita com design atual
- **Flexibilidade:** Preparado para evoluções futuras
- **ROI:** Alto valor com baixo custo de implementação

A arquitetura proposta atende perfeitamente às necessidades atuais e futuras do Taskora, estabelecendo uma base sólida para o crescimento do sistema.
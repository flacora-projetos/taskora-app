import { EventBus } from '../utils/EventBus.js';

const SettingsPage = {
    state: {
        currentTab: 'general',
        settings: {
            general: {
                theme: 'light',
                language: 'pt-BR',
                notifications: true,
                autoSave: true
            },
            account: {
                email: '',
                name: '',
                avatar: ''
            },
            privacy: {
                shareData: false,
                analytics: true,
                cookies: true
            }
        },
        isLoading: false
    },

    init() {
        this.render();
        this.attachEventListeners();
        this.loadSettings();
    },

    render() {
        const container = document.createElement('div');
        container.id = 'settings-container';
        container.innerHTML = `
            <style>
                /* Container removido - usando estrutura padrão da aplicação */
                
                .st-sticky {
                    position: sticky;
                    top: 75px;
                    background: #F8F9FA;
                    z-index: 10;
                    padding: 32px 32px 20px 32px;
                    border-bottom: 2px solid #E4E7E4;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .st-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 10px 0;
                }
                
                .st-subtitle {
                    color: #6b7280;
                    font-size: 16px;
                    margin: 0;
                }
                
                .st-tabs {
                    display: flex;
                    gap: 0;
                    margin-top: 20px;
                    border-bottom: 2px solid #f3f4f6;
                }
                
                .st-tab {
                    padding: 12px 24px;
                    background: none;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .st-tab.active {
                    color: #3b82f6;
                    border-bottom-color: #3b82f6;
                }
                
                .st-tab:hover {
                    color: #3b82f6;
                }
                
                .st-content {
                    flex: 1;
                    padding: 0 32px 32px 32px;
                    overflow: auto;
                }
                
                .st-section {
                    display: none;
                    max-width: 600px;
                }
                
                .st-section.active {
                    display: block;
                }
                
                .st-group {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 24px;
                    margin-bottom: 24px;
                }
                
                .st-group-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 16px 0;
                }
                
                .st-field {
                    margin-bottom: 20px;
                }
                
                .st-field:last-child {
                    margin-bottom: 0;
                }
                
                .st-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 6px;
                }
                
                .st-input, .st-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    background: #fff;
                    transition: border-color 0.2s;
                }
                
                .st-input:focus, .st-select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .st-switch {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                }
                
                .st-switch-label {
                    font-size: 14px;
                    color: #374151;
                    flex: 1;
                }
                
                .st-toggle {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    background: #d1d5db;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .st-toggle.active {
                    background: #3b82f6;
                }
                
                .st-toggle::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                
                .st-toggle.active::after {
                    transform: translateX(20px);
                }
                
                .st-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .st-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .st-btn-primary {
                    background: #3b82f6;
                    color: #fff;
                }
                
                .st-btn-primary:hover {
                    background: #2563eb;
                }
                
                .st-btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }
                
                .st-btn-secondary:hover {
                    background: #e5e7eb;
                }
                
                .st-loading {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }
                
                @media (max-width: 768px) {
                    /* Container responsivo removido */
                    
                    .st-tabs {
                        flex-wrap: wrap;
                    }
                    
                    .st-tab {
                        padding: 10px 16px;
                        font-size: 13px;
                    }
                    
                    .st-group {
                        padding: 20px;
                    }
                    
                    .st-actions {
                        flex-direction: column;
                    }
                }
            </style>
            
            <div>
                <div class="st-sticky">
                    <h1 class="st-title">Ajustes</h1>
                    <p class="st-subtitle">Configure suas preferências e configurações do aplicativo</p>
                    
                    <div class="st-tabs">
                        <button class="st-tab active" data-tab="general">Geral</button>
                        <button class="st-tab" data-tab="account">Conta</button>
                        <button class="st-tab" data-tab="privacy">Privacidade</button>
                    </div>
                </div>
                
                <div class="st-content">
                    <div class="st-section active" data-section="general">
                        <div class="st-group">
                            <h3 class="st-group-title">Aparência</h3>
                            
                            <div class="st-field">
                                <label class="st-label">Tema</label>
                                <select class="st-select" data-setting="theme">
                                    <option value="light">Claro</option>
                                    <option value="dark">Escuro</option>
                                    <option value="auto">Automático</option>
                                </select>
                            </div>
                            
                            <div class="st-field">
                                <label class="st-label">Idioma</label>
                                <select class="st-select" data-setting="language">
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Español</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="st-group">
                            <h3 class="st-group-title">Comportamento</h3>
                            
                            <div class="st-switch">
                                <span class="st-switch-label">Notificações</span>
                                <div class="st-toggle" data-setting="notifications"></div>
                            </div>
                            
                            <div class="st-switch">
                                <span class="st-switch-label">Salvamento automático</span>
                                <div class="st-toggle active" data-setting="autoSave"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="st-section" data-section="account">
                        <div class="st-group">
                            <h3 class="st-group-title">Informações da Conta</h3>
                            
                            <div class="st-field">
                                <label class="st-label">Nome</label>
                                <input type="text" class="st-input" data-setting="name" placeholder="Seu nome completo">
                            </div>
                            
                            <div class="st-field">
                                <label class="st-label">Email</label>
                                <input type="email" class="st-input" data-setting="email" placeholder="seu@email.com">
                            </div>
                        </div>
                    </div>
                    
                    <div class="st-section" data-section="privacy">
                        <div class="st-group">
                            <h3 class="st-group-title">Configurações de Privacidade</h3>
                            
                            <div class="st-switch">
                                <span class="st-switch-label">Compartilhar dados de uso</span>
                                <div class="st-toggle" data-setting="shareData"></div>
                            </div>
                            
                            <div class="st-switch">
                                <span class="st-switch-label">Analytics</span>
                                <div class="st-toggle active" data-setting="analytics"></div>
                            </div>
                            
                            <div class="st-switch">
                                <span class="st-switch-label">Cookies funcionais</span>
                                <div class="st-toggle active" data-setting="cookies"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="st-actions">
                        <button class="st-btn st-btn-primary" id="saveSettings">Salvar Alterações</button>
                        <button class="st-btn st-btn-secondary" id="resetSettings">Restaurar Padrões</button>
                    </div>
                </div>
            </div>
        `;
        
        // Inicializar após renderizar
        setTimeout(() => {
            this.attachEventListeners();
            this.loadSettings();
        }, 100);
        
        return container;
    },

    attachEventListeners() {
        // Tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('st-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Toggle switches
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('st-toggle')) {
                this.toggleSetting(e.target);
            }
        });

        // Save settings
        document.addEventListener('click', (e) => {
            if (e.target.id === 'saveSettings') {
                this.saveSettings();
            }
            if (e.target.id === 'resetSettings') {
                this.resetSettings();
            }
        });

        // Input changes
        document.addEventListener('change', (e) => {
            if (e.target.dataset.setting) {
                this.updateSetting(e.target.dataset.setting, e.target.value);
            }
        });
    },

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.st-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.st-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelector(`[data-section="${tabName}"]`).classList.add('active');

        this.state.currentTab = tabName;
    },

    toggleSetting(toggle) {
        toggle.classList.toggle('active');
        const setting = toggle.dataset.setting;
        const value = toggle.classList.contains('active');
        this.updateSetting(setting, value);
    },

    updateSetting(key, value) {
        const currentTab = this.state.currentTab;
        if (this.state.settings[currentTab]) {
            this.state.settings[currentTab][key] = value;
        }
    },

    loadSettings() {
        this.state.isLoading = true;
        
        // Simulate loading
        setTimeout(() => {
            // Load saved settings from localStorage
            const savedSettings = localStorage.getItem('taskora_settings');
            if (savedSettings) {
                this.state.settings = { ...this.state.settings, ...JSON.parse(savedSettings) };
            }
            
            this.applySettings();
            this.state.isLoading = false;
        }, 500);
    },

    applySettings() {
        // Apply general settings
        const themeSelect = document.querySelector('[data-setting="theme"]');
        if (themeSelect) themeSelect.value = this.state.settings.general.theme;
        
        const languageSelect = document.querySelector('[data-setting="language"]');
        if (languageSelect) languageSelect.value = this.state.settings.general.language;
        
        // Apply toggles
        const notificationsToggle = document.querySelector('[data-setting="notifications"]');
        if (notificationsToggle) {
            notificationsToggle.classList.toggle('active', this.state.settings.general.notifications);
        }
        
        const autoSaveToggle = document.querySelector('[data-setting="autoSave"]');
        if (autoSaveToggle) {
            autoSaveToggle.classList.toggle('active', this.state.settings.general.autoSave);
        }
        
        // Apply account settings
        const nameInput = document.querySelector('[data-setting="name"]');
        if (nameInput) nameInput.value = this.state.settings.account.name;
        
        const emailInput = document.querySelector('[data-setting="email"]');
        if (emailInput) emailInput.value = this.state.settings.account.email;
        
        // Apply privacy settings
        const shareDataToggle = document.querySelector('[data-setting="shareData"]');
        if (shareDataToggle) {
            shareDataToggle.classList.toggle('active', this.state.settings.privacy.shareData);
        }
        
        const analyticsToggle = document.querySelector('[data-setting="analytics"]');
        if (analyticsToggle) {
            analyticsToggle.classList.toggle('active', this.state.settings.privacy.analytics);
        }
        
        const cookiesToggle = document.querySelector('[data-setting="cookies"]');
        if (cookiesToggle) {
            cookiesToggle.classList.toggle('active', this.state.settings.privacy.cookies);
        }
    },

    saveSettings() {
        // Save to localStorage
        localStorage.setItem('taskora_settings', JSON.stringify(this.state.settings));
        
        // Show success message
        EventBus.emit('showNotification', {
            type: 'success',
            message: 'Configurações salvas com sucesso!'
        });
    },

    resetSettings() {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            localStorage.removeItem('taskora_settings');
            this.state.settings = {
                general: {
                    theme: 'light',
                    language: 'pt-BR',
                    notifications: true,
                    autoSave: true
                },
                account: {
                    email: '',
                    name: '',
                    avatar: ''
                },
                privacy: {
                    shareData: false,
                    analytics: true,
                    cookies: true
                }
            };
            this.applySettings();
            
            EventBus.emit('showNotification', {
                type: 'info',
                message: 'Configurações restauradas para o padrão'
            });
        }
    }
};

// Exportar para o sistema de páginas
if (typeof window !== 'undefined') {
    window.TaskoraPages = window.TaskoraPages || {};
    window.TaskoraPages.settings = {
        render: () => {
            return SettingsPage.render();
        }
    };
}

export { SettingsPage };

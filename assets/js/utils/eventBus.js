// EventBus.js - Sistema de eventos para comunicação entre módulos

class EventBusClass {
  constructor() {
    this.events = {};
  }

  /**
   * Registra um listener para um evento
   * @param {string} event - Nome do evento
   * @param {function} callback - Função callback
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove um listener de um evento
   * @param {string} event - Nome do evento
   * @param {function} callback - Função callback a ser removida
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emite um evento para todos os listeners
   * @param {string} event - Nome do evento
   * @param {*} data - Dados a serem enviados
   */
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro no listener do evento ${event}:`, error);
      }
    });
  }

  /**
   * Registra um listener que será executado apenas uma vez
   * @param {string} event - Nome do evento
   * @param {function} callback - Função callback
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove todos os listeners de um evento
   * @param {string} event - Nome do evento
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Lista todos os eventos registrados
   * @returns {Array} Array com nomes dos eventos
   */
  getEvents() {
    return Object.keys(this.events);
  }

  /**
   * Verifica se um evento tem listeners
   * @param {string} event - Nome do evento
   * @returns {boolean}
   */
  hasListeners(event) {
    return this.events[event] && this.events[event].length > 0;
  }

  /**
   * Retorna o número de listeners para um evento
   * @param {string} event - Nome do evento
   * @returns {number}
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}

// Exporta uma instância única (singleton)
export const EventBus = new EventBusClass();

// Exporta também a classe para casos especiais
export { EventBusClass };
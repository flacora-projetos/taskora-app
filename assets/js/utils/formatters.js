// formatters.js - Utilitários para formatação de dados

/**
 * Formata um valor monetário para o padrão brasileiro
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: 'BRL')
 * @returns {string} Valor formatado
 */
export function formatCurrency(value, currency = 'BRL') {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  } catch (error) {
    // Fallback para formatação manual
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
}

/**
 * Formata uma data para o padrão brasileiro
 * @param {Date|string|number} date - Data a ser formatada
 * @param {string} format - Formato desejado ('short', 'long', 'datetime')
 * @returns {string} Data formatada
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';

  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else if (date.toDate && typeof date.toDate === 'function') {
    // Firebase Timestamp
    dateObj = date.toDate();
  } else {
    return '';
  }

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('pt-BR');
      case 'long':
        return dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'datetime':
        return dateObj.toLocaleString('pt-BR');
      case 'time':
        return dateObj.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return dateObj.toLocaleDateString('pt-BR');
    }
  } catch (error) {
    // Fallback para formatação manual
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

/**
 * Formata um número com separadores de milhares
 * @param {number} value - Número a ser formatado
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    // Fallback para formatação manual
    const fixed = value.toFixed(decimals);
    return fixed.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

/**
 * Formata um telefone brasileiro
 * @param {string} phone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
  if (!phone) return '';

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Aplica formatação baseada no tamanho
  if (cleaned.length === 10) {
    // Telefone fixo: (11) 1234-5678
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    // Celular: (11) 91234-5678
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else {
    return phone; // Retorna original se não conseguir formatar
  }
}

/**
 * Formata um CPF
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado
 */
export function formatCPF(cpf) {
  if (!cpf) return '';

  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
}

/**
 * Formata um CNPJ
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';

  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
}

/**
 * Formata um CEP
 * @param {string} cep - CEP a ser formatado
 * @returns {string} CEP formatado
 */
export function formatCEP(cep) {
  if (!cep) return '';

  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
}

/**
 * Formata bytes em formato legível
 * @param {number} bytes - Número de bytes
 * @param {number} decimals - Casas decimais
 * @returns {string} Tamanho formatado
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formata uma porcentagem
 * @param {number} value - Valor decimal (0.5 = 50%)
 * @param {number} decimals - Casas decimais
 * @returns {string} Porcentagem formatada
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Trunca um texto com reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitaliza a primeira letra de cada palavra
 * @param {string} text - Texto a ser capitalizado
 * @returns {string} Texto capitalizado
 */
export function capitalizeWords(text) {
  if (!text) return '';

  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Remove acentos de um texto
 * @param {string} text - Texto com acentos
 * @returns {string} Texto sem acentos
 */
export function removeAccents(text) {
  if (!text) return '';

  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Para compatibilidade com módulos que não usam ES6
if (typeof window !== 'undefined') {
  window.formatCurrency = formatCurrency;
  window.formatDate = formatDate;
  window.formatNumber = formatNumber;
  window.formatPhone = formatPhone;
  window.formatCPF = formatCPF;
  window.formatCNPJ = formatCNPJ;
  window.formatCEP = formatCEP;
  window.formatBytes = formatBytes;
  window.formatPercentage = formatPercentage;
  window.truncateText = truncateText;
  window.capitalizeWords = capitalizeWords;
  window.removeAccents = removeAccents;
}
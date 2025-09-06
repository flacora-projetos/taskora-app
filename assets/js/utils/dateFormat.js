/**
 * Utilitários para conversão de formatos de data
 * Entre formato americano (YYYY-MM-DD) e brasileiro (DD/MM/YYYY)
 */

/**
 * Converte data do formato americano (YYYY-MM-DD) para brasileiro (DD/MM/YYYY)
 * @param {string} americanDate - Data no formato YYYY-MM-DD
 * @returns {string} Data no formato DD/MM/YYYY ou string vazia se inválida
 */
export function americanToBrazilian(americanDate) {
  if (!americanDate || typeof americanDate !== 'string') return '';
  
  const match = americanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Converte data do formato brasileiro (DD/MM/YYYY) para americano (YYYY-MM-DD)
 * @param {string} brazilianDate - Data no formato DD/MM/YYYY
 * @returns {string} Data no formato YYYY-MM-DD ou string vazia se inválida
 */
export function brazilianToAmerican(brazilianDate) {
  if (!brazilianDate || typeof brazilianDate !== 'string') return '';
  
  const match = brazilianDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return '';
  
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data (Date, Timestamp ou string) para o formato brasileiro (DD/MM/YYYY)
 * @param {Date|Object|string} date - Data a ser formatada
 * @returns {string} Data no formato DD/MM/YYYY ou string vazia se inválida
 */
export function formatToBrazilian(date) {
  if (!date) return '';
  
  let d;
  
  // Se é um Timestamp do Firestore
  if (date && typeof date.toDate === 'function') {
    d = date.toDate();
  }
  // Se é uma string no formato americano
  else if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return americanToBrazilian(date);
  }
  // Se é uma string no formato brasileiro, retorna como está
  else if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    return date;
  }
  // Se é uma Date ou timestamp numérico
  else if (date instanceof Date || typeof date === 'number') {
    d = new Date(date);
  }
  else {
    return '';
  }
  
  if (isNaN(d)) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data (Date, Timestamp ou string) para o formato americano (YYYY-MM-DD)
 * @param {Date|Object|string} date - Data a ser formatada
 * @returns {string} Data no formato YYYY-MM-DD ou string vazia se inválida
 */
export function formatToAmerican(date) {
  if (!date) return '';
  
  let d;
  
  // Se é um Timestamp do Firestore
  if (date && typeof date.toDate === 'function') {
    d = date.toDate();
  }
  // Se é uma string no formato brasileiro
  else if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    return brazilianToAmerican(date);
  }
  // Se é uma string no formato americano, retorna como está
  else if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return date;
  }
  // Se é uma Date ou timestamp numérico
  else if (date instanceof Date || typeof date === 'number') {
    d = new Date(date);
  }
  else {
    return '';
  }
  
  if (isNaN(d)) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma data brasileira (DD/MM/YYYY) para objeto Date
 * @param {string} brazilianDate - Data no formato DD/MM/YYYY
 * @returns {Date|null} Objeto Date ou null se inválida
 */
export function parseBrazilianDate(brazilianDate) {
  if (!brazilianDate || typeof brazilianDate !== 'string') return null;
  
  const match = brazilianDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  
  return isNaN(date) ? null : date;
}
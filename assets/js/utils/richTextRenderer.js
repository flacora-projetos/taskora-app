/**
 * Rich Text Renderer - Utilitário para renderização de texto rico com fallback
 * Garante compatibilidade com dados existentes (texto simples) e novos dados (HTML)
 */

/**
 * Verifica se o texto contém HTML válido
 * @param {string} text - Texto a ser verificado
 * @returns {boolean} - True se contém HTML
 */
function containsHTML(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Verifica se contém tags HTML básicas
  const htmlPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlPattern.test(text);
}

/**
 * Escapa caracteres HTML para exibição segura
 * @param {string} text - Texto a ser escapado
 * @returns {string} - Texto escapado
 */
function escapeHTML(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitiza HTML permitindo apenas tags seguras
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} - HTML sanitizado
 */
function sanitizeHTML(html) {
  if (!html) return '';
  
  // Tags permitidas para formatação básica
  const allowedTags = ['p', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'br'];
  
  // Criar um elemento temporário para sanitização
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Função recursiva para limpar elementos
  function cleanElement(element) {
    const children = Array.from(element.children);
    
    children.forEach(child => {
      const tagName = child.tagName.toLowerCase();
      
      if (!allowedTags.includes(tagName)) {
        // Remove tag não permitida, mas mantém conteúdo
        const textContent = child.textContent;
        const textNode = document.createTextNode(textContent);
        child.parentNode.replaceChild(textNode, child);
      } else {
        // Remove todos os atributos (por segurança)
        while (child.attributes.length > 0) {
          child.removeAttribute(child.attributes[0].name);
        }
        
        // Limpa recursivamente
        cleanElement(child);
      }
    });
  }
  
  cleanElement(temp);
  return temp.innerHTML;
}

/**
 * Renderiza descrição com fallback automático
 * @param {string} description - Descrição da tarefa
 * @param {Object} options - Opções de renderização
 * @returns {string} - HTML renderizado
 */
function renderDescription(description, options = {}) {
  const {
    fallbackText = '—',
    maxLength = null,
    allowHTML = true
  } = options;
  
  // Se não há descrição, retorna fallback
  if (!description || description.trim() === '') {
    return `<span class="text-muted">${fallbackText}</span>`;
  }
  
  // Se contém HTML e HTML é permitido
  if (allowHTML && containsHTML(description)) {
    let sanitized = sanitizeHTML(description);
    
    // Aplicar limite de caracteres se especificado
    if (maxLength && sanitized.length > maxLength) {
      // Truncar preservando tags HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitized;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      if (textContent.length > maxLength) {
        const truncated = textContent.substring(0, maxLength - 3) + '...';
        return `<span title="${escapeHTML(textContent)}">${escapeHTML(truncated)}</span>`;
      }
    }
    
    return sanitized;
  }
  
  // Caso contrário, trata como texto simples
  let plainText = description.toString();
  
  // Aplicar limite de caracteres
  if (maxLength && plainText.length > maxLength) {
    const truncated = plainText.substring(0, maxLength - 3) + '...';
    return `<span title="${escapeHTML(plainText)}">${escapeHTML(truncated)}</span>`;
  }
  
  // Converter quebras de linha em <br> para texto simples
  const withBreaks = escapeHTML(plainText).replace(/\n/g, '<br>');
  return withBreaks;
}

/**
 * Converte texto simples para HTML básico
 * @param {string} text - Texto simples
 * @returns {string} - HTML básico
 */
function textToHTML(text) {
  if (!text) return '';
  
  // Escapa HTML e converte quebras de linha
  let html = escapeHTML(text).replace(/\n/g, '<br>');
  
  // Converte parágrafos duplos em tags <p>
  html = html.replace(/(<br>\s*){2,}/g, '</p><p>');
  
  // Envolve em parágrafo se não está vazio
  if (html.trim()) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

/**
 * Converte HTML para texto simples
 * @param {string} html - HTML a ser convertido
 * @returns {string} - Texto simples
 */
function htmlToText(html) {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Converte <br> e </p> em quebras de linha
  temp.innerHTML = temp.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  temp.innerHTML = temp.innerHTML.replace(/<\/p>/gi, '\n\n');
  
  return (temp.textContent || temp.innerText || '').trim();
}

/**
 * Classe principal para gerenciar renderização de rich text
 */
class RichTextRenderer {
  constructor(options = {}) {
    this.options = {
      fallbackText: '—',
      maxLength: null,
      allowHTML: true,
      ...options
    };
  }
  
  /**
   * Renderiza descrição com as opções da instância
   */
  render(description) {
    return renderDescription(description, this.options);
  }
  
  /**
   * Verifica se o texto é rich text
   */
  isRichText(text) {
    return containsHTML(text);
  }
  
  /**
   * Sanitiza HTML
   */
  sanitize(html) {
    return sanitizeHTML(html);
  }
  
  /**
   * Converte para texto simples
   */
  toPlainText(html) {
    return htmlToText(html);
  }
  
  /**
   * Converte texto simples para HTML
   */
  fromPlainText(text) {
    return textToHTML(text);
  }
}

// Instância global padrão
const richTextRenderer = new RichTextRenderer();

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RichTextRenderer,
    richTextRenderer,
    renderDescription,
    containsHTML,
    escapeHTML,
    sanitizeHTML,
    textToHTML,
    htmlToText
  };
}

// Exportações ES6 para módulos
export {
  RichTextRenderer,
  richTextRenderer,
  renderDescription,
  containsHTML,
  escapeHTML,
  sanitizeHTML,
  textToHTML,
  htmlToText
};

// Exportações globais para compatibilidade
window.RichTextRenderer = RichTextRenderer;
window.richTextRenderer = richTextRenderer;
window.renderDescription = renderDescription;
window.containsHTML = containsHTML;
window.escapeHTML = escapeHTML;
window.sanitizeHTML = sanitizeHTML;
window.textToHTML = textToHTML;
window.htmlToText = htmlToText;

console.log('✅ Rich Text Renderer carregado com sucesso');
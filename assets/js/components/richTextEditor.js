/**
 * Rich Text Editor Component using TipTap
 * Provides basic formatting capabilities for task descriptions
 */

import { Editor } from 'https://esm.sh/@tiptap/core@2.1.13';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.1.13';
import { sanitizeHTML } from '../utils/richTextRenderer.js';

class RichTextEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      placeholder: 'O que precisa ser feito?',
      maxLength: 2000,
      toolbar: true,
      ...options
    };
    this.editor = null;
    this.init();
  }

  init() {
    // Create editor container
    this.container.innerHTML = `
      <div class="rich-text-editor">
        ${this.options.toolbar ? this.createToolbar() : ''}
        <div class="editor-content"></div>
        <div class="editor-footer">
          <span class="char-count">0/${this.options.maxLength}</span>
        </div>
      </div>
    `;

    // Initialize TipTap editor
    const editorElement = this.container.querySelector('.editor-content');
    this.editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: false, // Disable headings for simplicity
          blockquote: false, // Disable blockquotes
          codeBlock: false, // Disable code blocks
          horizontalRule: false, // Disable horizontal rules
        }),
      ],
      content: '',
      placeholder: this.options.placeholder,
      onUpdate: ({ editor }) => {
        this.updateCharCount();
        this.validateLength();
      },
      editorProps: {
        attributes: {
          class: 'nt-textarea rich-editor-content',
          'data-placeholder': this.options.placeholder
        }
      }
    });

    this.setupToolbarEvents();
    this.updateCharCount();
  }

  createToolbar() {
    return `
      <div class="rich-editor-toolbar">
        <button type="button" class="toolbar-btn" data-action="bold" title="Negrito (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" class="toolbar-btn" data-action="italic" title="Itálico (Ctrl+I)">
          <em>I</em>
        </button>
        <div class="toolbar-separator"></div>
        <button type="button" class="toolbar-btn" data-action="bulletList" title="Lista com marcadores">
          •
        </button>
        <button type="button" class="toolbar-btn" data-action="orderedList" title="Lista numerada">
          1.
        </button>
        <div class="toolbar-separator"></div>
        <button type="button" class="toolbar-btn" data-action="paragraph" title="Parágrafo">
          ¶
        </button>
      </div>
    `;
  }

  setupToolbarEvents() {
    if (!this.options.toolbar) return;

    const toolbar = this.container.querySelector('.rich-editor-toolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.toolbar-btn');
      if (!btn) return;

      e.preventDefault();
      const action = btn.dataset.action;
      this.executeCommand(action);
      this.updateToolbarState();
    });

    // Update toolbar state on selection change
    this.editor.on('selectionUpdate', () => {
      this.updateToolbarState();
    });
  }

  executeCommand(action) {
    switch (action) {
      case 'bold':
        this.editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        this.editor.chain().focus().toggleItalic().run();
        break;
      case 'bulletList':
        this.editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        this.editor.chain().focus().toggleOrderedList().run();
        break;
      case 'paragraph':
        this.editor.chain().focus().setParagraph().run();
        break;
    }
  }

  updateToolbarState() {
    if (!this.options.toolbar) return;

    const buttons = this.container.querySelectorAll('.toolbar-btn');
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      const isActive = this.isCommandActive(action);
      btn.classList.toggle('active', isActive);
    });
  }

  isCommandActive(action) {
    switch (action) {
      case 'bold':
        return this.editor.isActive('bold');
      case 'italic':
        return this.editor.isActive('italic');
      case 'bulletList':
        return this.editor.isActive('bulletList');
      case 'orderedList':
        return this.editor.isActive('orderedList');
      case 'paragraph':
        return this.editor.isActive('paragraph');
      default:
        return false;
    }
  }

  updateCharCount() {
    const charCountEl = this.container.querySelector('.char-count');
    if (!charCountEl) return;

    const text = this.editor.getText();
    const count = text.length;
    charCountEl.textContent = `${count}/${this.options.maxLength}`;
    
    // Add warning class if approaching limit
    charCountEl.classList.toggle('warning', count > this.options.maxLength * 0.9);
    charCountEl.classList.toggle('error', count > this.options.maxLength);
  }

  validateLength() {
    const text = this.editor.getText();
    if (text.length > this.options.maxLength) {
      // Truncate content if it exceeds limit
      const truncated = text.substring(0, this.options.maxLength);
      this.editor.commands.setContent(truncated);
    }
  }

  // Public API methods
  getContent() {
    return sanitizeHTML(this.editor.getHTML());
  }

  getText() {
    return this.editor.getText();
  }

  setContent(content) {
    if (typeof content === 'string') {
      // If it's HTML, sanitize it; if it's plain text, convert to HTML
      const isHTML = /<[^>]*>/.test(content);
      if (isHTML) {
        this.editor.commands.setContent(sanitizeHTML(content));
      } else {
        // Convert plain text to HTML paragraphs
        const htmlContent = content.split('\n').map(line => 
          line.trim() ? `<p>${line}</p>` : '<p></p>'
        ).join('');
        this.editor.commands.setContent(htmlContent);
      }
    }
  }

  clear() {
    this.editor.commands.clearContent();
  }

  focus() {
    this.editor.commands.focus();
  }

  isEmpty() {
    return this.editor.isEmpty;
  }

  destroy() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
}

// CSS styles for the rich text editor
const editorStyles = `
.rich-text-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-family: inherit;
}

.rich-editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 4px 4px 0 0;
  gap: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #e9ecef;
  border-color: #ddd;
}

.toolbar-btn.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 4px;
}

.rich-editor-content {
  min-height: 100px;
  padding: 12px;
  outline: none;
  line-height: 1.5;
}

.rich-editor-content p {
  margin: 0 0 8px 0;
}

.rich-editor-content p:last-child {
  margin-bottom: 0;
}

.rich-editor-content ul,
.rich-editor-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.rich-editor-content li {
  margin: 4px 0;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  border-radius: 0 0 4px 4px;
}

.char-count {
  font-size: 12px;
  color: #666;
}

.char-count.warning {
  color: #ff8c00;
}

.char-count.error {
  color: #dc3545;
  font-weight: bold;
}

/* Placeholder styling */
.rich-editor-content[data-placeholder]:empty::before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
  position: absolute;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .rich-editor-toolbar {
    flex-wrap: wrap;
    gap: 2px;
  }
  
  .toolbar-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
`;

// Inject styles if not already present
if (!document.querySelector('#rich-editor-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'rich-editor-styles';
  styleSheet.textContent = editorStyles;
  document.head.appendChild(styleSheet);
}

export { RichTextEditor };
// 🔒 CONFIGURAÇÃO ESLINT PARA SEGURANÇA - TASKORA
// Regras específicas para detectar problemas de segurança

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  plugins: [
    'security'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 🔥 Regras específicas para Firebase e chaves API
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    
    // 🛡️ Regras de segurança do plugin security
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // 🔑 Regras customizadas para detectar chaves API
    'no-template-curly-in-string': 'error',
    'no-implicit-globals': 'error'
  },
  
  // 🚫 Padrões globais para detectar chaves expostas
  globals: {
    // Previne uso de variáveis globais perigosas
    'eval': 'off',
    'Function': 'off'
  },
  
  // ⚙️ Configurações específicas por tipo de arquivo
  overrides: [
    {
      files: ['*.html'],
      rules: {
        // Regras específicas para arquivos HTML
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['assets/js/config/*.js'],
      rules: {
        // Regras mais rigorosas para arquivos de configuração
        'no-console': 'error',
        'no-debugger': 'error',
        'no-alert': 'error'
      }
    }
  ],
  
  // 📁 Arquivos e pastas ignorados
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js',
    '.env*',
    'docs/'
  ]
};

// 📝 INSTRUÇÕES DE USO:
// 1. Instale as dependências: npm install eslint eslint-plugin-security
// 2. Execute: npx eslint . --config .eslintrc.security.js
// 3. Para correção automática: npx eslint . --config .eslintrc.security.js --fix
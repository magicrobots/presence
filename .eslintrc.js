module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  env: {
    browser: true,
    es6: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'no-console': 1,
    'react/react-in-jsx-scope': 'off'
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        'vite.config.*',
        'vitest.config.*'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2020
      },
      env: {
        browser: false,
        node: true,
        es6: true
      }
    }
  ]
};

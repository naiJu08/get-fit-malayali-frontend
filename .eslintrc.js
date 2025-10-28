module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect', // Automatically detect the react version
    },
  },

  rules: {
    'react/jsx-uses-vars': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'off',
    'react/prop-types': 'off', // Disable prop-types rule
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'], // Applies these settings only to TypeScript files
      rules: {
        'react/prop-types': 'off', // Disable prop-types in TypeScript files
      },
    },
  ],
}

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'src/payload-types.ts',
      'src/migrations/',
      'src/app/(payload)/',
    ],
  },
]

export default eslintConfig

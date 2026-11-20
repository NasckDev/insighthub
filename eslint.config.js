import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/storybook-static/**', '**/coverage/**', '**/node_modules/**', '**/*.db'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'jsx-a11y': jsxA11y, 'react-hooks': reactHooks },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
  {
    // The UI standard: screens only see the wrappers in src/ui. Ant Design, ECharts and the icon set are
    // imported there and nowhere else (Storybook config included, which only mounts the provider).
    files: ['apps/web/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/ui/**', 'apps/web/.storybook/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['antd', 'antd/*', '@ant-design/*', 'echarts', 'echarts/*', 'echarts-for-react', 'echarts-for-react/*', 'dayjs', 'dayjs/*'],
              message: 'Use os componentes de src/ui (AppButton, AppTable, AppChart...). antd, echarts e dayjs só podem ser importados dentro de src/ui.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/scripts/**/*.mjs', 'apps/web/playwright.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
);

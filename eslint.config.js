import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Ban raw HTML elements outside of src/components
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}', 'src/contexts/**/*.{ts,tsx}', 'src/App.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message: 'Use the Button component from @/components/ui instead of raw <button> elements.',
        },
        {
          // Only ban text-like inputs, allow file/range/checkbox/radio inputs
          selector: 'JSXOpeningElement[name.name="input"]:not(:has(JSXAttribute[name.name="type"][value.value="file"])):not(:has(JSXAttribute[name.name="type"][value.value="range"])):not(:has(JSXAttribute[name.name="type"][value.value="checkbox"])):not(:has(JSXAttribute[name.name="type"][value.value="radio"]))',
          message: 'Use the Input component from @/components/ui instead of raw <input> elements.',
        },
      ],
    },
  },
)

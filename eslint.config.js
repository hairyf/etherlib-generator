// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
    },
    ignores: [
      'sources',
      'skills',
      'playground/artifacts',
      'playground/dist',
    ],
  },
)

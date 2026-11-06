module.exports = {
  extends: ['@galaxy/eslint-config'],
  ignorePatterns: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  settings: {
    'import/resolver': {
      node: {},
      typescript: { project: __dirname + '/tsconfig.json' }
    }
  }
}

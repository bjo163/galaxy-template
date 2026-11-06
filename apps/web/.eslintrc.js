module.exports = {
  extends: ['@galaxy/eslint-config'],
  settings: {
    'import/resolver': {
      node: {},
      typescript: { project: __dirname + '/tsconfig.json' }
    }
  }
}

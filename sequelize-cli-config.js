module.exports = {
  production: {
    use_env_variable: 'CMD_DB_URL',
    dialect: 'postgres'
  },
  development: {
    use_env_variable: 'CMD_DB_URL',
    dialect: 'postgres'
  }
}

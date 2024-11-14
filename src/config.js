module.exports = {
  serverport: 3000,
  loginCred: {
    postgresql: {
      host: process.env.DB_HOST,
      port: "5432",
      password: process.env.POSTGRES_ROOT,
      idle_in_transaction_session_timeout: 30000,
      user: "root"
    },
    redis: {
      socket: {
        host: "localhost",
        port: 6379,
      },
      password: process.env.REDIS_CLI
    }
  }
}
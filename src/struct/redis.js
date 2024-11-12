const redis = require('redis')
const config = require('../config')

module.exports = class Redis {
  constructor() {
    this.ready = false;

    const { host, port, db, password } = config.loginCred.redis;

    this.redisClient = redis.createClient({
      socket: {
        host, port
      },
      password,
      database: db
    });

    this.redisClient.on("connect", () => {
      this.ready = true;
      console.log('[MessageBroker - Redis] Successfully connected to Redis Database.')
    })

    this.redisClient.on("end", () => {
      this.ready = false;
      console.warn("[MessageBroker - Redis] Disconnected from Redis Database. Please resolve this as soon as possible")
    });
  }
}
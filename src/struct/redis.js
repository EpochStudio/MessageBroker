const redis = require('redis')

module.exports = class Redis {
  constructor(clientOptions = {}) {
    this.ready = false;

    this.redisClient = redis.createClient(clientOptions);

    this.redisClient.on("connect", () => {
      this.ready = true;
      console.log('[MessageBroker - Redis] Successfully connected to Redis Database.')
    })

    this.redisClient.on("end", () => {
      this.ready = false;
      console.warn("[MessageBroker - Redis] Disconnected from Redis Database. Please resolve this as soon as possible")
    });
  }
  async connect() {
    await this.redisClient.connect();

    await this.redisClient.flushDb();
  }
  async getHash() {

  }
  delete(key) {

  }
  deleteHashField(key, field) {

  }
  async setHash(key, field, value, time) {

  }
  async setHashes(key, time, values = {}) {

  }
  async getKey(key, json = true) {

  }
  async getHashField(key, field, json = true) {

  }
  async setKey(key, data, time) {

  }
}
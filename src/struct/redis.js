const redis = require('redis')
const {log, debug, error, warn} = require('../utils/logger')

module.exports = class Redis {
  constructor(clientOptions = {}) {
    this.ready = false;

    this.redisClient = redis.createClient(clientOptions);

    this.redisClient.on("connect", () => {
      this.ready = true;
      log('[MessageBroker - Redis]', 'Successfully connected to Redis Database.')
    })

    this.redisClient.on("end", () => {
      this.ready = false;
      warn("[MessageBroker - Redis]", "Disconnected from Redis Database. Please resolve this as soon as possible")
    });
  }

  async connect() {
    await this.redisClient.connect();

    await this.redisClient.flushDb();
  }

  async getHash(key) {
    if (!this.ready) return null;
    debug(
      "Redis Cache",
      `Received request for receiving hash data for key: ${key}.`,
    );

    const data = await this.redisClient.HGETALL(key);

    if (!data || !Object.keys(data).length) return null;

    return JSON.parse(JSON.stringify(data));
  }

  async delete(key) {
    if (!this.ready) return null;
    debug(
      "Redis Cache",
      `Received request for deleting hash data: ${key}`,
    );

    await this.redisClient.del(key);
  }

  async deleteHashField(key, field) {
    if (!this.ready) return null;
    debug(
      "Redis Cache",
      `Received request for deleting hash ${key} field ${field} data`,
    );
    await this.redisClient.hDel(key, field);
  }

  async setHash(key, field, value, time) {
    if (!this.ready) return null;

    debug(
      "Redis Cache",
      `Received request for saving data for key: ${key} of field: ${field}.`,
    );
    let json = false;
    if (typeof value === "object") json = true;

    await this.redisClient.hSet(
      key,
      field,
      json ? JSON.stringify(value) : value,
    );

    if (time && time !== -1) await this.redisClient.expire(key, time);
  }

  /**
   *
   * @param {string} key Key
   * @param {number} time Time
   * @param {{}} values Values
   */
  async setHashes(key, time, values = {}) {
    if (!this.ready) return null;
    if (Object.keys(values).length <= 0) return;

    debug(
      "Redis Cache",
      `Received request for saving data for key: ${key}`,
    );

    await this.redisClient.hSet(key, values);

    if (time && time !== -1) await this.redisClient.expire(key, time);
  }

  async getKey(key, json = true) {
    if (!this.ready) return null;
    debug(
      "Redis Cache",
      `Received request for receiving data for key: ${key}.`,
    );

    const data = await this.redisClient.get(key);

    if (!data) return null;

    return json ? JSON.parse(data) : data;
  }

  async getHashField(key, field, json = true) {
    if (!this.ready) return null;
    debug(
      "Redis Cache",
      `Received request for receiving data for key: ${key} field: ${field}`,
    );

    const data = await this.redisClient.hGet(key, field);
    return json ? JSON.parse(data) : data;
  }

  async setKey(key, data, time) {
    if (!this.ready) return null;

    debug(
      "Redis Cache",
      `Received request for saving data for key: ${key}.`,
    );
    let json = false;
    if (typeof data === "object" || Array.isArray(data)) json = true;

    await this.redisClient.set(key, json ? JSON.stringify(data) : data);

    if (time && time !== -1) await this.redisClient.expire(key, time);
  }
}
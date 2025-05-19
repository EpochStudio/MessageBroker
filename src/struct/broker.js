require('dotenv').config()

const {Server} = require('socket.io')
const Constants = require('../utils/constant')
const RedisManager = require('./redis')
const {warn, log} = require('../utils/logger');
const {property, loginCred} = require('../config');

module.exports = class Broker extends Server {
  constructor() {
    super(property.port);

    this.config = require('../config')
    this.redis = new RedisManager({
      ...loginCred.redis,
      database: property.redisDb
    });
    this.ready = false;
  }

  async init() {
    await Promise.all([
      this.validateServerConfiguration(),
      this.redis.connect()
    ]).then(c => {
      console.log("Message Broker is online")
    })
  }

  validateServerConfiguration() {
    if (property.authentication.require && !property.authentication.authKey) {
      throw new Error('[NOAUTH] Authentication Key not supplied in config file.')
    }
  }
}


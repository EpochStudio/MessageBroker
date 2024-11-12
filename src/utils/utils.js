const { Snowflake } = require("@sapphire/snowflake");
const Constants = require('./constant')

/**
 * Generates an unique snowflake
 * @returns {bigint}
 */
function snowflake() {
  const epoch  = new Date(Constants.galaxiesEpoch)

  const snowflake = new Snowflake(epoch)

  return snowflake.generate()
}

module.exports = {
  snowflake
}
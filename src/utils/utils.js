const { Snowflake } = require("@sapphire/snowflake");
const Constants = require('./constant')
const { glob} = require('glob')
const path = require('path')

module.exports = class Utils {
  constructor(client) {
    this.client = client;
  }

  get directory() {
    return `${path.dirname(require.main.filename)}${path.sep}`
  }

  snowflake() {
    const epoch  = new Date(Constants.galaxiesEpoch)

    const snowflake = new Snowflake(epoch)

    return snowflake.generate()
  }
  async LoadEvents() {
    await glob(path.join(this.directory, "events", "**", "*.js"))
      .then((eventFile) => {
        for (const event of eventFile) {
          delete require.cache[event]

          const File = require(event)

          const events = new File(this.client)


        }
      })
  }
}
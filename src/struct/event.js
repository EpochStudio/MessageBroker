/**
 * @typedef {Object} Options
 * @property {?string} name
 * @property {boolean} disabled
 */

module.exports = class Event {
  /**
   *
   * @param {import('./broker')} client
   * @param {Options} options
   */
  constructor(client, options = {}) {
    this.client = client;

    this.name = options.name;

    this.disabled = options.disabled || false
  }

  /**
   *
   * @param {import('socket.io').Socket} socket
   * @param {...args} args
   * @returns {Promise<void>}
   */
  async execute(socket, ...args) {
    socket.emit("error", {
      code: "400",
      message: "Bad Request - This event is not established."
    })
  }
}
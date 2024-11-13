function log(title, content) {
  console.log(`[Process ${process.pid}] [${title}] » ${content}`)
}

function error(...error) {
  console.error(`[Process ${process.pid}] [Error] »`, ...error.map(err2 => err2.stack || err2))
}

function warn(title, content) {
  console.warn(`[Process ${process.pid}] [${title} - Warn] » ${content}`)
}

function debug(title, content) {
  console.log(`[Process ${process.pid}] [${title} - Debug] » ${content}`)
}

module.exports = {
  log,
  debug,
  error,
  warn
}
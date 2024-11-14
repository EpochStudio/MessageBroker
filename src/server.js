require('dotenv').config()

const {Server} = require('socket.io')
const Constants = require('./utils/constant')
const io = new Server(3000);
const RedisManager = require('./struct/redis')
const RedisClient = new RedisManager({...require('./config').loginCred.redis, database: 9});
const {warn} = require('./utils/logger');

console.log(`[Message Broker] Running on version ${require('../package.json').version} stable.`)

io.on('connection', (socket) => {
  console.log(`Client connected! Session ID: ${socket.id}`)

  socket.on('registerCluster', async (clientOptions = {}, callback) => {
    // Verifying client options passed through.

    if (!String(clientOptions.clusterId) || !clientOptions.signature) return socket.disconnect(true);
    if (typeof clientOptions.receiveBuffer !== 'object' || !clientOptions.receiveBuffer.length) return socket.disconnect(true);

    let violation = false;
    for (const buffer of clientOptions.receiveBuffer) {
      if (!Constants.allowedBuffers.includes(buffer)) {
        violation = true;
        break;
      }
    }
    if (violation) return socket.disconnect(true);

    // Callback if necessary
    try {
      await callback(200)
    } catch (err) {
      if (err.message.includes("function")) {
        console.log("Callback not issued, as an acknowledgment from the server was not required.")
      }
    }

    const regKey = `${clientOptions.signature}:${clientOptions.clusterId}`
    const isExists = await RedisClient.getKey(regKey);
    if (isExists) return socket.disconnect(true);

    await RedisClient.setKey(regKey, {
      sessionId: socket.id,
      registeredKey: regKey,
      allowedBuffer: clientOptions.receiveBuffer,
      receiveTransactionInfo: clientOptions.receiveTransactionInfo || false
    });

    console.log(`Client registered: ${regKey} with Session ID: ${socket.id} with Signature: ${clientOptions.signature} | Cluster: ${clientOptions.clusterId}`)
  })

  socket.on('cronJobMessage', async (tid, transactionInfo = {}, data = {}, callback) => {
    try {
      await callback(200)
    } catch (err) {
      if (err.message.includes("function")) {
        console.log("Callback not issued, as an acknowledgment from the server was not required.")
      }
    }

    console.log(`Transaction item received from cronjob: T${tid}`);

    if (!transactionInfo.database.toLowerCase()) return warn('INVALID_DATABASE_RECEIVED', 'The database name received via transaction info was not received.')

    for await (const key of RedisClient.redisClient.scanIterator({
      MATCH: `${transactionInfo.database.toLowerCase()}:*`
    })) {
      const registry = await RedisClient.getKey(key);
      if (!registry) continue;

      const [clientSignature, clientCluster] = registry.registeredKey.split(":");
      if (!registry.allowedBuffer.includes(transactionInfo.interval)) continue;

      await io.timeout(10000).to(registry.sessionId).emitWithAck('messageFromCron', {
        registeredKey: key,
        tid,
        transactionInfo: registry.receiveTransactionInfo ? transactionInfo : null,
        data
      })

      console.log(`Forwarded ${transactionInfo.type} (Interval ${transactionInfo.interval}) to connection ${clientSignature} of cluster ${clientCluster} // CID: ${key} // TID: ${tid}`);
    }
  })

  socket.on('disconnect', async (reason) => {
    console.log(`Client Disconnected! Session ID: ${socket.id} with Reason: ${reason}`)

    for await (const key of RedisClient.redisClient.scanIterator()) {
      const registry = await RedisClient.getKey(key);
      if (!registry) continue;

      if (registry.sessionId === socket.id) {
        await RedisClient.delete(key);
        console.log(`Client unregistered: ${key} with Session ID: ${socket.id}`)
      }
    }
  })
})

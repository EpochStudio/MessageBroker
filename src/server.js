const {Server} = require('socket.io')
const Constants = require('./utils/constant')
const io = new Server(3000);

const clients = {};

console.log(`[Message Broker] Running on version ${require('../package.json').version} stable.`)

io.on('connection', (socket) => {
  console.log(`Client connected! Session ID: ${socket.id}`)

  socket.on('registerCluster', async (clientOptions = {}, callback) => {
    // Verifying client options passed through.

    if (!String(clientOptions.clusterId) || !clientOptions.signature) return socket.disconnect(true);
    if (typeof clientOptions.receiveBuffer !== 'object' || !clientOptions.length) return socket.disconnect(true);

    for (const buffer of clientOptions.receiveBuffer) {
      if (!Constants.allowedBuffers.includes(buffer)) {
        socket.disconnect(true)
        break;
      }
    }

    // Callback if necessary
    try {
      await callback(200)
    } catch (err) {
      if (err.message.includes("function")) {
        console.log("Callback not issued, as an acknowledgment from the server was not required.")
      }
    }

    // Register in the System
    clients[`${clientOptions.signature}_${clientOptions.clusterId}`] = {
      sessionId: socket.id,
      signature: `${clientOptions.signature}_${clientOptions.clusterId}`,
      allowedBuffer: clientOptions.receiveBuffer,
      receiveTransactionInfo: clientOptions.receiveTransactionInfo || false
    };
    console.log(`Cluster registered: ${clientOptions.clusterId} with Session ID: ${socket.id} with Signature: ${clientOptions.signature}`)
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

    for (const key of Object.keys(clients)) {
      const [clientSignature, clientCluster] = key.split("_")

      if (transactionInfo.database.toLowerCase() !== clientSignature.toLowerCase()) continue;
      if (!clients[key].allowedBuffer.includes(transactionInfo.interval)) continue;

      await io.to(clients[key].sessionId).emitWithAck('messageFromCron', {
        registeredKey: key,
        tid,
        transactionInfo: clients[key].receiveTransactionInfo ? transactionInfo : null,
        data
      });
      console.log(`Forwarded ${transactionInfo.type} (Interval ${transactionInfo.interval}) to connection ${clientSignature} of cluster ${clientCluster} // CID: ${key} // TID: ${tid}`);
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`Client Disconnected! Session ID: ${socket.id} with Reason: ${reason}`)

    for (const clusterId of Object.keys(clients)) {
      if (clients[clusterId].sessionId === socket.id) {
        delete clients[clusterId];
        console.log(`Cluster unregistered: ${clusterId} with Session ID: ${socket.id}`)
      }
    }
  })
})
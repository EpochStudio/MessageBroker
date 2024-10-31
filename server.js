const {Server} = require('socket.io')
const io = new Server(3000);

const clusters = {};

console.log(`[Message Broker] Running on version ${require('./package.json').version} stable.`)

io.on('connection', (socket) => {
  console.log(`Client connected! Session ID: ${socket.id}`)

  socket.on('registerCluster', async(client = {}, callback) => {
    if (!String(client.clusterId) || !client.signature) return socket.disconnect();

    try {
      await callback(200)
    } catch (err) {
      if (err.message.includes("function")) {
        console.log("Callback not issued, as an acknowledgment from the server was not required.")
      }
    }

    clusters[`${client.signature}_${client.clusterId}`] = socket.id;
    console.log(`Cluster registered: ${client.clusterId} with Session ID: ${socket.id} with Signature: ${client.signature}`)
  })

  socket.on('cronJobMessage', async (msg, data = {}, callback) => {
    try {
      await callback(200)
    } catch (err) {
      if (err.message.includes("function")) {
        console.log("Callback not issued, as an acknowledgment from the server was not required.")
      }
    }

    console.log(`Received message from cron job: ${msg}`);

    for (const keys of Object.keys(clusters)) {
      const [name, type, _time] = msg.split("_");
      const [clientSignature, clientCluster] = keys.split("_")

      if (name.toLowerCase() !== clientSignature.toLowerCase()) return;

      io.to(clusters[keys]).emit('messageFromCron', {clusterId: keys, msg, data});
      console.log(`Forwarded ${type} to Cluster ${clientCluster}`, {clusterId: keys, msg});
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`Client Disconnected! Session ID: ${socket.id} with Reason: ${reason}`)

    for (const clusterId in Object.keys(clusters)) {
      if (clusters[clusterId] === socket.id) {
        delete clusters[clusterId];
        console.log(`Cluster unregistered: ${clusterId} with Session ID: ${socket.id}`)
        break;
      }
    }
  })
})
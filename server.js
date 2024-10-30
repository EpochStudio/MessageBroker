const { Server } = require('socket.io')
const io = new Server(3000);

const clusters= {};

io.on('connection', (socket) => {
  console.log(`Client connected! Session ID: ${socket.id}`)

  socket.on('registerCluster', (clusterId, signature) => {
    if (!clusterId || !signature) return socket.disconnect(true);

    clusters[`${signature}.${clusterId}`] = socket.id;
    console.log(`Cluster registered: ${clusterId} with Session ID: ${socket.id} with Signature: ${signature}`)
  })

  socket.on('cronJobMessage', (msg, data = {}) => {
    console.log(`Received message from cron job: ${msg}`);

    for (const keys in Object.keys(clusters)) {
      const [name, type, _time] = msg.split("_");
      const [clientSignature, clientCluster] = keys.split(".")

      if (name.toLowerCase() !== clientSignature.toLowerCase()) return;

      io.to(clusters[keys]).emit('messageFromCron', { clusterId: keys, msg, data });
      console.log(`Forwarded ${type} to Cluster ${clientCluster}`, { clusterId: keys, msg });
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

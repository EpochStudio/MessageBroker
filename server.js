const { Server } = require('socket.io')
const io = new Server(3000);

const clusters= {};

io.on('connection', (socket) => {
  console.log(`Client connected! Session ID: ${socket.id}`)

  socket.on('registerCluster', (clusterId) => {
    clusters[clusterId] = socket.id;
    console.log(`Cluster registered: ${clusterId} with Session ID: ${socket.id}`)
  })

  socket.on('cronJobMessage', (msg, data = {}) => {
    console.log(`Received message from cron job: ${msg}`);

    for (const clusterId in Object.keys(clusters)) {
      io.to(clusters[clusterId]).emit('messageFromCron', { clusterId, msg, data });
      console.log(`Forwarded message to Cluster ${clusterId}`, { clusterId, msg });
    }
  })

  socket.on('disconnect', () => {
    console.log(`Client Disconnected! Session ID: ${socket.id}`)

    for (const clusterId in Object.keys(clusters)) {
      if (clusters[clusterId] === socket.id) {
        delete clusters[clusterId];
        console.log(`Cluster unregistered: ${clusterId} with Session ID: ${socket.id}`)
        break;
      }
    }
  })
})

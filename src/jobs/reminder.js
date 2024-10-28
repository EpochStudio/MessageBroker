require('dotenv').config()

console.log("===== RUNNING JOB.REMINDER ======")



const pg = require('pg')
const {io} = require('socket.io-client');

(async() => {
  const socket = io('ws://localhost:3000');

  socket.on('connect', async() => {
    console.log("Started Checking Process... Attempting to connect to database,")

    const database = pg.Client({
      host: process.env.DB_HOST,
      port: "5432",
      password: process.env.POSTGRES_ROOT,
      database: "galaxies",
      idle_in_transaction_session_timeout: 30000,
      user: "root",
    })

    try {
      await database.connect();

      console.log("Successfully established connection")
    } catch (err) {
      console.log("Something went wrong while connecting to the database,")
      console.error(err);

      process.exit(1);
    }

    const dbQuery = await database.query(`SELECT * FROM reminder WHERE CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $1`, [Date.now()]);


    socket.emit("cronJobMessage", `reminder_batch_${Date.now()}`, dbQuery.rows)
  })
})()
require('dotenv').config()

const pg = require('pg')
const {io} = require('socket.io-client');

const socket = io('ws://localhost:3000');

console.log("Starting Cron Job")

socket.on('connect', async () => {
  console.log("Starting checking process... attempting to connect to the database.")

  console.log(process.env.POSTGRES_ROOT)

  const database = new pg.Client({
    host: process.env.DB_HOST,
    port: "5432",
    password: process.env.POSTGRES_ROOT,
    database: "galaxiesbeta",
    idle_in_transaction_session_timeout: 30000,
    user: "root",
  })

  try {
    await database.connect();

    console.log("Successfully established database connection.")
  } catch (err) {
    console.log("Error occurred, stopping all action.")
    console.error(err);

    process.exit(1);
  }

  const reminder = await database.query(`SELECT * FROM reminder WHERE CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $1`, [Date.now()]);
  const premium = await database.query(`SELECT * FROM guilds WHERE premium ->> 'status' = $1 AND CAST(premium -> 'durations' ->> 'date' AS BIGINT) + CAST(premium -> 'durations' ->> 'time' AS BIGINT) <= $2`, [true, Date.now()])
  const infraction = await database.query(`SELECT * FROM infractions WHERE infractionType = $1 AND infractionActive = $2 AND CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $3`, ["mute", true, Date.now()])
  const giveaway = await database.query(`SELECT * FROM giveaway WHERE active = $1 AND date + time <= $2`, [true, Date.now()])

  await Promise.all([
    socket.emit("cronJobMessage", `reminder_batch_${Date.now()}`, reminder.rows),
    socket.emit("cronJobMessage", `entitlement_batch_${Date.now()}`, premium.rows),
    socket.emit("cronJobMessage", `punishment_batch_${Date.now()}`, infraction.rows),
    socket.emit("cronJobMessage", `giveaway_batch_${Date.now()}`, giveaway.rows)
  ])

  console.log("==== JOB DONE === EXITTING ===")

  process.exit();
})
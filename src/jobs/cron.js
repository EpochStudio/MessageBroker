require('dotenv').config()

const pg = require('pg')
const {io} = require('socket.io-client');
const socket = io('ws://localhost:3000');

console.log("[START] Starting Cron Job")

socket.on('connect', async () => {
  console.log("[DB_CONNECTION] Starting checking process... attempting to connect to the database.")

  const database = new pg.Client({
    host: process.env.DB_HOST,
    port: "5432",
    password: process.env.POSTGRES_ROOT,
    database: "galaxies",
    idle_in_transaction_session_timeout: 30000,
    user: "root",
  })

  try {
    await database.connect();

    console.log("[DB_CONNECTION_SUCCESS] Successfully established database connection.")
  } catch (err) {
    console.log("[DB_CONNECTION_ERROR] Error occurred, stopping all action.")
    console.error(err);

    process.exit(1);
  }

  const reminder = await database.query(`SELECT * FROM reminder WHERE CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $1`, [Date.now()]);
  const premium = await database.query(`SELECT * FROM guilds WHERE premium ->> 'status' = $1 AND premium -> 'durations' ->> 'time' IS NOT NULL AND CAST(premium -> 'durations' ->> 'date' AS BIGINT) + CAST(premium -> 'durations' ->> 'time' AS BIGINT) <= $2`, [true, Date.now()])
  const infraction = await database.query(`SELECT * FROM infractions WHERE infractionType = $1 AND infractionActive = $2 AND durations ->> 'time' IS NOT NULL AND CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $3`, ["mute", true, Date.now()])
  const giveaway = await database.query(`SELECT * FROM giveaway WHERE active = $1 AND date + time <= $2`, [true, Date.now()])

  await socket.emit("cronJobMessage", `${database.connectionParameters.database}_data_${Date.now()}`, {
    reminder: reminder.rows,
    entitlement: premium.rows,
    punishment: infraction.rows,
    giveaway: giveaway.rows
  })

  console.log("[JOB_DONE] Job completed... attempting to gracefully shutdown...")

  try {
    await Promise.all([
      database.end(),
      socket.disconnect()
    ])

    console.log("[COMPLETION - GRACEFUL] Graceful Shutdown Operation completed. Disconnected from Message Broker Server and Database Client")

    process.exit(1);
  } catch (err) {
    console.log("[COMPLETION - FORCEFUL] A graceful shutdown was not successful. Issuing a forceful shutdown")

    console.error(err);

    process.exit(1);
  }
})

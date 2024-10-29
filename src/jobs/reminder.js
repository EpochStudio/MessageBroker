require('dotenv').config()
const {WebhookClient} = require('discord.js')

const webhook = "https://discord.com/api/webhooks/1300723985880973353/HEh6bQC2dwdKeRN8sU10X9cnV-LGztoBMgwr6BHyBogaUhOI8DzWw1DQgSSJpz5MsvA-";
const pg = require('pg')
const {io} = require('socket.io-client');
const [id, token] = webhook.slice('https://discord.com/api/webhooks/'.length).split("/")
const webookCli = new WebhookClient({id, token})

const socket = io('ws://localhost:3000');

webookCli.send({content: "Cronjob ran reminder.js"})
console.log("Cronjob ran reminder.js")

socket.on('connect', async () => {
  await webookCli.send({content: "Started Checking Process... Attempting to connect to database,"})
  console.log("Starting")

  console.log(process.env.POSTGRES_ROOT)

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

    await webookCli.send({content: "Successfully established connection"})
    console.log("Success")
  } catch (err) {
    await webookCli.send({content: "Something went wrong while connecting to the database,"})
    await webookCli.send({ content: err.message });

    console.log("ERR")
    console.error(err);

    process.exit(1);
  }

  const dbQuery = await database.query(`SELECT * FROM reminder WHERE CAST(durations ->> 'date' AS BIGINT) + CAST(durations ->> 'time' AS BIGINT) <= $1`, [Date.now()]);

  socket.emit("cronJobMessage", `reminder_batch_${Date.now()}`, dbQuery.rows)
})
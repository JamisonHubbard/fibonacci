const keys = require('./keys');

// express app setup
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// postgres client setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  port: keys.pgPort,
  database: keys.pgDatabase,
  password: keys.pgPassword,
});
pgClient.on('error', () => console.log('Lost PG Connection'));

// setup 'values' postgres table with retry
function createTable() {
  pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .then(() => console.log('PG table created'))
    .catch((err) => {
      console.log('PG not ready, retrying in 2s...', err.message);
      setTimeout(createTable, 2000);
    });
}
createTable();

// redis client setup
const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: keys.redisHost,
    port: keys.redisPort,
    reconnectStrategy: () => 1000,
  },
});
redisClient.on('error', (err) => console.log('Redis Client Error', err.message));

const redisPublisher = redisClient.duplicate();
const redisSubscriber = redisClient.duplicate();

async function connectRedis() {
  await redisClient.connect();
  await redisPublisher.connect();
  await redisSubscriber.connect();
  console.log('Redis connected');

  // subscribe to worker "result" events and broadcast to SSE clients
  await redisSubscriber.subscribe('result', (message) => {
    const data = JSON.parse(message);
    broadcastSSE('result', data);
  });
}
connectRedis();

// SSE client tracking
const sseClients = [];

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => res.write(payload));
}

// SSE endpoint
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// express route handlers
app.get('/', (req, res) => {
  res.send('hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  const values = await redisClient.hGetAll('values');
  res.send(values);
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  console.log('API received index ' + index.toString());

  if (parseInt(index) > 40) {
    return res.status(422).send('index too high');
  }

  await redisClient.hSet('values', index, 'nothing');
  await redisPublisher.publish('insert', index);

  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  broadcastSSE('index', { number: parseInt(index) });

  res.send({ working: true });
});

app.listen(5000, () => {
  console.log('Listening on port 5000');
});

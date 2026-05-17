const keys = require('./keys');
const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: keys.redisHost,
    port: keys.redisPort,
    reconnectStrategy: () => 1000,
  },
});
redisClient.on('error', (err) => console.log('Redis Client Error', err.message));

const subscriber = redisClient.duplicate();
subscriber.on('error', (err) => console.log('Redis Subscriber Error', err.message));

const publisher = redisClient.duplicate();
publisher.on('error', (err) => console.log('Redis Publisher Error', err.message));

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

async function start() {
  await redisClient.connect();
  await subscriber.connect();
  await publisher.connect();

  await subscriber.subscribe('insert', async (message) => {
    console.log('Worker received index: ' + message);
    const result = fib(parseInt(message));
    await redisClient.hSet('values', message, result.toString());
    await publisher.publish('result', JSON.stringify({ index: message, value: result.toString() }));
  });

  console.log('Worker listening for insert events');
}

start();

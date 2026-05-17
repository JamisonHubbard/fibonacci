const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib (index - 2);
}

// whenever a "message" is received in redis
sub.on('message', (channel, message) => {
  console.log('Redis recieved index: ' + message);

  // insert into a hash map called 'values'
  // key is 'message', value is the calculated fib value
  redisClient.hset('values', message, fib(parseInt(message)));
});
sub.subscribe('insert');

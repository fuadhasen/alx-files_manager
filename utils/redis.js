import { createClient } from 'redis';

const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // ES6 way of creating function
  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  async get(key) {
    const reply = await this.getAsync(key);
    return reply;
  }

  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    await this.delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;

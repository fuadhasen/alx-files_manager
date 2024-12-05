import { createClient } from 'redis'
const { promisify } = require('util')


class RedisClient {
  constructor() {
    this.client  = createClient();
    this.client.on('error', (err) => {
        console.log(err)
    });
  }

  // ES6 way of creating function
  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client)
    const reply = await getAsync(key)
    return reply;
  }

  async set(key, value, duration) {
    const setexAsync = promisify(this.client.setex).bind(this.client)
    await setexAsync(key, duration, value)
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client)
    await delAsync(key)
  }

}

const redisClient = new RedisClient()
module.exports = redisClient
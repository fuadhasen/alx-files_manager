import { createClient } from 'redis'


class RedisClient {
  constructor() {
    this.client  = createClient();
    client.on('error', (err) => {
        console.log(err)
    });
  }

    // ES6 way of creating function
  isAlive() {
    return new Promise((resolve, reject) => {
      this.client.on('error', () => {
        reject(false);
      })

      this.client.on('connect', () => {
        resolve(true);
      })
    })

  }
}
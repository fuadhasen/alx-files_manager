import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    return res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    const nbuser = await dbClient.nbUsers();
    const nbfiles = await dbClient.nbFiles();
    return res.status(200).json({ users: nbuser, files: nbfiles });
  }
}

export default AppController;

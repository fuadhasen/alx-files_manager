import { redisClient } from "../utils/redis"
import { dbClient } from "../utils/db"


class AppController {
  static getStatus(req, res) {
    res.status(200).json({ "redis": redisClient.isAlive(), "db": dbClient.isAlive() })
  }


  static async getStats(req, res) {
    const nbuser = await dbClient.nbuser()
    const nbfiles = await dbClient.nbfiles()
    res.status(200).json({"users": nbuser, "files": nbfiles })
  }
}


module.exports = AppController

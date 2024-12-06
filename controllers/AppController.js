import { redisClient } from "../utils/redis"
import { dbClient } from "../utils/db"


class AppController {
  static getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.status(200).json({ "redis": true, "db": true })
    }
  }


  static getStats(req, res) {
    const nbuser = dbClient.nbuser()
    const nbfiles = dbClient.nbfiles()
    res.status(200).json({"users": nbuser, "files": nbfiles })
  }
}


export default AppController
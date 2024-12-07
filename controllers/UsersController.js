import crypto from 'crypto'
import { redisClient } from "../utils/redis"
import { dbClient } from "../utils/db"


class UserController {
  static postNew(req, res) {
    const { email } = req.body.email;
    const { pwd } = req.body.password;
    if (!email) {
      res.status(400).send("Missing email")
    }

    if (!password) {
      res.status(400).send("Missing password")
    }

    const users = dbClient.userCollection;
    users.findOne({'email': email}, (err, document) => {
      if (document) {
        res.status(400).send('Already exist');
      }
    })

    const hashed = crypto.createHash('sha1')
    hashed.update(pwd)

    users.inserOne({'email': email, 'password': hashed}, (error, reply) => {
      res.status(201).json({"id": reply.id, "email": reply.email})
    })
  }

}


module.exports = UserController;

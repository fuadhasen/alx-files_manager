import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UserController {
  static postNew(req, res) {
    const { email } = req.body;
    const pwd = req.body.password;
    if (!email) {
      return res.status(400).json({"error": "Missing email"});
    }

    if (!pwd) {
      return res.status(400).json({"error": "Missing password"});
    }

    const users = dbClient.userCollection;
    users.findOne({ email }, (err, document) => {
      if (document) {
        return res.status(400).json({"error": 'Already exist'});
      }

      const hashed = crypto.createHash('sha1');
      hashed.update(pwd);
      const hashedPwd = hashed.digest('hex');
  
      users.insertOne({ email, password: hashedPwd }, (error, reply) => {
        return res.status(201).json({ id: reply.insertedId, email });
      });
    });
  }

  static getMe(req, res) {
    const user = dbClient.userCollection
    const token = req.headers['X-Token']

    redisClient.get(`auth_${token}`).then((doc_id) => {
      console.log(doc_id)
      if (!doc_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }

      user.findOne({"id": doc_id}, (error, document) => {
        return res.status(401).json({"id": doc_id, "email": document.email})
      })
    })
  }
}

export default UserController;

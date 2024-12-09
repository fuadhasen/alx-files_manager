import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { v4: uuidv4 } = require('uuid');

class AuthController {
  static getConnect(req, res) {
    const users = dbClient.userCollection;

    const auth = req.headers.authorization;
    const credential = auth.split(' ')[1];

    const decodedstr = Buffer.from(credential, 'base64').toString('utf-8');
    const str = decodedstr.split(':');
    const email = str[0];
    const password = str[1];

    const hashed = crypto.createHash('sha1');
    hashed.update(password);
    const hashedPwd = hashed.digest('hex');

    users.findOne({ "email": email, "password": hashedPwd },  (err, document) => {
      if (!document) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      const duration = 24 * 3600;

      const documentId = document._id.toString()
      redisClient.set(`auth_${token}`, documentId, duration)
      .then(() => {
        return res.status(200).json({ "token": token });
      })
      .catch((error) => {
        console.log(error);
      })

    });
  }

  static getDisconnect(req, res) {
    const token = req.headers['x-token'];
    redisClient.get(`auth_${token}`)
    .then((reply) => {
      if (!reply) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    })
    .catch((err) => {
      console.log(err);
    })

    redisClient.del(`auth_${token}`)
    .then(() => {
      return res.status(204).send();
    })
    .catch((err) => {
      console.log(err);
    })
  
  }
}

export default AuthController;

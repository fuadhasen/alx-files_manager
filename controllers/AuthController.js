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
    console.log(str);
    const email = str[0];
    const password = str[1];

    const hashed = crypto.createHash('sha1');
    hashed.update(password);
    const hashedPwd = hashed.digest('hex');

    users.findOne({ "email": email, "password": hashedPwd }, (err, document) => {
      if (!document) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      redisClient.setAsync(`auth_${token}`, document.id, 'EX', 24 * 3600)
        .then(() => {
          return res.status(200).json({ "token": token });
        });
    });
  }

  static getDisconnect(req, res) {
    const token = req.headers['X-Token'];
    redisClient.get(`auth_${token}`)
      .then((error, reply) => {
        if (error) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      });

    redisClient.del(`auth_${token}`);
    return res.status(204);
  }
}

export default AuthController;

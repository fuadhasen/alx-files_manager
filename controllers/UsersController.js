import crypto from 'crypto';
import dbClient from '../utils/db';

class UserController {
  static postNew(req, res) {
    const { email } = req.body;
    const pwd = req.body.password;
    if (!email) {
      res.status(400).send('Missing email');
      return;
    }

    if (!pwd) {
      res.status(400).send('Missing password');
      return;
    }

    const users = dbClient.userCollection;
    users.findOne({ email }, (err, document) => {
      if (document) {
        res.status(400).send('Already exist');
      }
    });

    const hashed = crypto.createHash('sha1');
    hashed.update(pwd);
    const hashedPwd = hashed.digest('hex');

    users.insertOne({ email, password: hashedPwd }, (error, reply) => {
      res.status(201).json({ id: reply.insertedId, email });
    });
  }
}

module.exports = UserController;

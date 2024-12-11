import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, { useUnifiedTopology: true, useNewUrlParser: true });

    // mongodb connection
    this.client.connect()
      .then(() => {
        this.db = this.client.db(this.database);
        this.userCollection = this.db.collection('users');
        this.fileCollection = this.db.collection('files');
      })
      .catch((error) => {
        console.log(error);
      });
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    const nbuser = await this.userCollection.countDocuments();
    return nbuser;
  }

  async nbFiles() {
    const nbfiles = await this.fileCollection.countDocuments();
    return nbfiles;
  }
}

const dbClient = new DBClient();
export default dbClient;

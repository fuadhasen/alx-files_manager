import express from 'express';
import router from './routes';

const app = express();

// to parse application/json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

app.listen((process.env.PORT || 5000), () => {
  console.log('Server running on port 5000');
});

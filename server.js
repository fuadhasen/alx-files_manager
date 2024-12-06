import express from 'express'
import router from './routes';

const app = express();


app.use('/', router);
app.use(express.json())


app.listen((process.env.PORT || 5000), () => {
    console.log('Server running on port 5000');
});
import express from 'express'
import AppController from '../controllers/AppController';
import UserController from '../controllers/UsersController.js';


const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/users', UserController.postNew)

export default router

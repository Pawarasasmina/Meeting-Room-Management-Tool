import express from 'express';
import { createRoom, getRooms } from '../controllers/roomController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getRooms);
router.post('/', protect, adminOnly, createRoom);

export default router;

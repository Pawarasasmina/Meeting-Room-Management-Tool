import express from 'express';
import {
  createReservation,
  getAvailabilityByDate,
  getReservations,
  updateReservationStatus
} from '../controllers/reservationController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getReservations);
router.get('/availability', protect, getAvailabilityByDate);
router.post('/', protect, createReservation);
router.patch('/:id/status', protect, adminOnly, updateReservationStatus);

export default router;

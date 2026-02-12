import Reservation from '../models/Reservation.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationService.js';

const hasConflict = async ({ roomId, startTime, endTime, excludeReservationId }) => {
  const query = {
    room: roomId,
    status: { $in: ['pending', 'approved'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const conflict = await Reservation.findOne(query);
  return !!conflict;
};

export const getReservations = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  const reservations = await Reservation.find(filter)
    .populate('room', 'name office capacity')
    .populate('user', 'name email')
    .sort({ startTime: 1 });

  return res.json(reservations);
};

export const createReservation = async (req, res) => {
  try {
    const { roomId, title, description, attendees, startTime, endTime } = req.body;

    if (!roomId || !title || !startTime || !endTime) {
      return res.status(400).json({ message: 'roomId, title, startTime and endTime are required.' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: 'Invalid time range.' });
    }

    const conflict = await hasConflict({ roomId, startTime: start, endTime: end });
    if (conflict) {
      return res.status(409).json({ message: 'This slot is already booked or pending approval.' });
    }

    const reservation = await Reservation.create({
      room: roomId,
      user: req.user._id,
      office: room.office,
      title,
      description,
      attendees,
      startTime: start,
      endTime: end
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          user: admin._id,
          message: `New reservation request: ${title} (${start.toLocaleString()} - ${end.toLocaleString()})`,
          type: 'info'
        })
      )
    );

    return res.status(201).json(reservation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update.' });
    }

    const reservation = await Reservation.findById(id).populate('room', 'name').populate('user', '_id');
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (status === 'approved') {
      const conflict = await hasConflict({
        roomId: reservation.room._id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        excludeReservationId: reservation._id
      });

      if (conflict) {
        return res.status(409).json({ message: 'Cannot approve due to overlapping reservation.' });
      }
    }

    reservation.status = status;
    await reservation.save();

    await createNotification({
      user: reservation.user._id,
      message: `Your reservation "${reservation.title}" is now ${status}.`,
      type: status === 'approved' ? 'success' : 'warning'
    });

    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAvailabilityByDate = async (req, res) => {
  try {
    const { roomId, date } = req.query;

    if (!roomId || !date) {
      return res.status(400).json({ message: 'roomId and date query params are required.' });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const reservations = await Reservation.find({
      room: roomId,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lte: dayEnd },
      endTime: { $gte: dayStart }
    }).select('startTime endTime status');

    const slots = [];
    for (let hour = 9; hour < 18; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = new Date(dayStart);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        const occupied = reservations.some((reservation) => reservation.startTime < end && reservation.endTime > start);
        slots.push({ startTime: start, endTime: end, available: !occupied });
      }
    }

    return res.json(slots);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

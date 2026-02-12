import Room from '../models/Room.js';

export const getRooms = async (_req, res) => {
  const rooms = await Room.find({ isActive: true }).sort({ createdAt: 1 });
  return res.json(rooms);
};

export const createRoom = async (req, res) => {
  try {
    const { name, capacity, amenities } = req.body;
    const room = await Room.create({ name, capacity, amenities });
    return res.status(201).json(room);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

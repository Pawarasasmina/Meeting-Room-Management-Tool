import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import connectDB from './config/db.js';
import Room from './models/Room.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/notifications', notificationRoutes);

const seedDefaultRoom = async () => {
  const existing = await Room.findOne({ office: '200M' });
  if (!existing) {
    await Room.create({
      name: '200M Main Meeting Room',
      office: '200M',
      capacity: 8,
      amenities: ['TV', 'Whiteboard', 'Video Conferencing']
    });
    console.log('Seeded default room for office 200M');
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedDefaultRoom();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

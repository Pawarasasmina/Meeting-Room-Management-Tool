import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    office: { type: String, default: '200M', required: true },
    capacity: { type: Number, default: 8 },
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;

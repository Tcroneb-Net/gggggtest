import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  username: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Contact', contactSchema);

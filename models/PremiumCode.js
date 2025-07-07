import mongoose from 'mongoose';

const premiumCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  expiresAt: { type: Date },
  used: { type: Boolean, default: false }
});

export default mongoose.model('PremiumCode', premiumCodeSchema);

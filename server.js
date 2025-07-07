import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PremiumCode from './models/PremiumCode.js';
import Contact from './models/Contact.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

app.post('/api/create-code', async (req, res) => {
  const code = uuidv4();
  await PremiumCode.create({
    code,
    expiresAt: dayjs().add(5, 'minutes').toDate()
  });
  res.json({ code });
});

app.get('/api/download', async (req, res) => {
  const { code } = req.query;
  const valid = await PremiumCode.findOne({ code });

  if (!valid) return res.status(404).send('❌ Invalid code');
  if (valid.used) return res.status(403).send('❌ Code already used');
  if (dayjs().isAfter(valid.expiresAt)) return res.status(410).send('❌ Code expired');

  // Mark used
  valid.used = true;
  await valid.save();

  // Example contacts
  const contacts = await Contact.find().limit(5);

  let vcf = '';
  contacts.forEach(c => {
    vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.username}\nTEL:${c.phone}\nEND:VCARD\n`;
  });

  res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');
  res.setHeader('Content-Type', 'text/vcard');
  res.send(vcf);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

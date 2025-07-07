import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';

import './bot.js'; // ✅ Start bot with server

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const contactSchema = new mongoose.Schema({
  type: String,
  username: String,
  contact: String,
  filepath: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

const codeSchema = new mongoose.Schema({
  code: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});
const Code = mongoose.model('Code', codeSchema);

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/contact', async (req, res) => {
  const { username, contact } = req.body;
  if (!username || !contact) return res.status(400).json({ message: 'Missing fields' });
  await Contact.create({ type: 'single', username, contact });
  res.json({ message: 'Contact saved' });
});

app.post('/api/upload', upload.single('vcf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  await Contact.create({ type: 'vcf', username: req.file.originalname, filepath: req.file.path });
  res.json({ message: 'VCF uploaded' });
});

app.post('/api/create-code', async (req, res) => {
  const code = uuidv4();
  await Code.create({ code, expiresAt: dayjs().add(5, 'minute').toDate() });
  res.json({ code });
});

app.get('/api/download', async (req, res) => {
  const contacts = await Contact.find({ type: 'single' });
  let vcf = '';
  contacts.forEach(c => {
    vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.username}\nTEL:${c.contact}\nEND:VCARD\n`;
  });
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');
  res.send(vcf);
});

app.get('/', (req, res) => res.send('✅ VCF & Bot server running.'));

app.listen(PORT, () => console.log(`✅ Server http://localhost:${PORT}`));

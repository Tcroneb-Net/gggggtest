import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ✅ Schemas
const contactSchema = new mongoose.Schema({
  type: { type: String, enum: ['single', 'vcf'], required: true },
  username: { type: String, required: true },
  contact: { type: String },
  filepath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const codeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Safe model registration
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
const Code = mongoose.models.Code || mongoose.model('Code', codeSchema);

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ✅ Add single contact
app.post('/api/contact', async (req, res) => {
  const { username, contact } = req.body;
  if (!username || !contact) return res.status(400).json({ message: 'Missing fields' });

  const exists = await Contact.findOne({ type: 'single', username, contact });
  if (exists) return res.status(409).json({ message: 'Contact already exists' });

  await Contact.create({ type: 'single', username, contact });
  res.json({ message: 'Contact saved!' });
});

// ✅ Upload VCF
app.post('/api/upload', upload.single('vcf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const username = req.file.originalname.replace('.vcf', '');
  await Contact.create({
    type: 'vcf',
    username,
    filepath: req.file.path
  });

  const vcfContent = fs.readFileSync(req.file.path, 'utf-8');
  const cards = vcfContent.split('END:VCARD');
  let added = 0;

  for (const card of cards) {
    if (card.includes('BEGIN:VCARD')) {
      const fnMatch = card.match(/FN:(.+)/);
      const telMatch = card.match(/TEL.*:(.+)/);

      const fn = fnMatch ? fnMatch[1].trim() : null;
      const tel = telMatch ? telMatch[1].trim() : null;

      if (fn && tel) {
        const exists = await Contact.findOne({ type: 'single', username: fn, contact: tel });
        if (!exists) {
          await Contact.create({ type: 'single', username: fn, contact: tel });
          added++;
        }
      }
    }
  }

  res.json({ message: `VCF uploaded & ${added} contacts extracted!` });
});

// ✅ Create premium code
app.post('/api/create-code', async (req, res) => {
  const expiresAt = dayjs().add(10, 'minutes').toDate();
  const newCode = uuidv4();

  await Code.create({ code: newCode, expiresAt });

  res.json({ code: newCode, expiresAt });
});

// ✅ Download with premium code
app.get('/api/download', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'No code provided' });

  const found = await Code.findOne({ code });
  if (!found) return res.status(404).json({ message: 'Invalid code' });

  if (found.used) return res.status(403).json({ message: 'Code already used' });
  if (new Date() > found.expiresAt) return res.status(410).json({ message: 'Code expired' });

  const contacts = await Contact.find({ type: 'single' });

  if (!contacts.length) return res.status(404).json({ message: 'No contacts found' });

  let vcfContent = '';
  contacts.forEach(c => {
    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.username}\nTEL:${c.contact}\nEND:VCARD\n`;
  });

  await Code.updateOne({ code }, { used: true });

  res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');
  res.setHeader('Content-Type', 'text/vcard');
  res.send(vcfContent);
});

// ✅ Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 Welcome ${msg.from.first_name}!

👉 Don't Share This : https://statusplus.zone.id

Press the button below to get your premium code.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎟️ Get Premium Code', callback_data: 'get_code' }],
          [{ text: '👨‍💻 Creators', callback_data: 'creators' }]
        ]
      }
    });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'get_code') {
    const expiresAt = dayjs().add(10, 'minutes').toDate();
    const newCode = uuidv4();
    await Code.create({ code: newCode, expiresAt });
    bot.sendMessage(chatId, `✅ Your Hacked premium code: \`${newCode}\`\nUse it within 10 minutes to download!`, { parse_mode: 'Markdown' });
  }

  if (query.data === 'creators') {
    bot.sendMessage(chatId, `🚀 *created by:*  Paid Tech Zone Team\n🤖 *Review :* Daemon Root\n💡 *Special thanks to :* Eksu Homes Tv`, { parse_mode: 'Markdown' });
  }
});

// ✅ Root fallback
app.get('/', (req, res) => {
  res.json({ message: '✅ API is running!' });
});

// ✅ Start server
app.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));

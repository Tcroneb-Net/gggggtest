import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

mongoose.connect(process.env.MONGODB_URI);

const Code = mongoose.model('Code', new mongoose.Schema({
  code: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
}));

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Welcome!\nOur new site: https://yourwebsite.com', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Get Premium Code', callback_data: 'get_code' }],
        [{ text: '📂 Download VCF', callback_data: 'download_vcf' }],
        [{ text: '👥 Creators', callback_data: 'creators' }]
      ]
    }
  });
});

bot.on('callback_query', async (query) => {
  const id = query.message.chat.id;
  if (query.data === 'get_code') {
    const code = uuidv4();
    await Code.create({ code, expiresAt: dayjs().add(5, 'minute').toDate() });
    bot.sendMessage(id, `🎟️ Your premium code: ${code}`);
  } else if (query.data === 'download_vcf') {
    bot.sendMessage(id, '📂 [Download VCF](https://yourwebsite.com/api/download)', { parse_mode: 'Markdown' });
  } else if (query.data === 'creators') {
    bot.sendMessage(id, '👑 Tcroneb Hackx | Daemon Root | TV');
  }
  bot.answerCallbackQuery(query.id);
});

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    `👋 Welcome ${msg.from.first_name}!\nVisit our new website: https://statusplus.zone.id`, 
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✨ Get Premium Code', callback_data: 'get_code' }],
          [{ text: '📥 Download VCF', callback_data: 'download_vcf' }],
          [{ text: '📊 Stats', callback_data: 'stats' }],
          [{ text: '👤 Creators', callback_data: 'creators' }]
        ]
      }
    }
  );
});

bot.on('callback_query', async (query) => {
  const { id, data, message } = query;

  if (data === 'get_code') {
    const res = await axios.post('https://ai-vcf.onrender.com/api/create-code');
    const code = res.data.code;
    bot.sendMessage(message.chat.id, `✅ Here is your premium code:\n\n<code>${code}</code>\n\nValid for 5 min.`, { parse_mode: 'HTML' });
  }

  if (data === 'download_vcf') {
    bot.sendMessage(message.chat.id, '⏳ Generating your VCF...');
    const res = await axios.post('https://ai-vcf.onrender.com/api/create-code');
    const code = res.data.code;
    const link = `https://ai-vcf.onrender.com/api/download?code=${code}`;
    bot.sendDocument(message.chat.id, link, {}, { filename: 'contacts.vcf' });
  }

  if (data === 'stats') {
    bot.sendMessage(message.chat.id, '📊 Total contacts: 100\n✅ Running smoothly!');
  }

  if (data === 'creators') {
    bot.sendMessage(message.chat.id, '🔖 Site remarked by Tcroneb Hackx\n👨‍💻 Helped by Daemon Root\n🧠 Main brain: tv');
  }
});

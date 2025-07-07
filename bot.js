import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', console.log);

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '👋 Welcome! Here’s our new website: https://yourwebsite.com',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Get Premium Code', callback_data: 'get_code' }],
          [{ text: '📂 Download VCF', callback_data: 'download_vcf' }],
          [{ text: '👥 Creators', callback_data: 'creators' }]
        ]
      }
    }
  );
});

bot.on('callback_query', async (query) => {
  const { data, message } = query;
  const chatId = message.chat.id;

  if (data === 'get_code') {
    bot.sendMessage(chatId, '🎟️ Here’s your premium code: 123456');
  } else if (data === 'download_vcf') {
    bot.sendMessage(chatId, '🔗 Download your VCF: https://yourwebsite.com/api/download?range=all');
  } else if (data === 'creators') {
    bot.sendMessage(
      chatId,
      '👑 Site remarked by Tcroneb Hackx, helped by Daemon Root, Main Brain TV.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'WhatsApp Channel', url: 'https://chat.whatsapp.com/yourchannel' }]
          ]
        }
      }
    );
  }

  bot.answerCallbackQuery(query.id);
});

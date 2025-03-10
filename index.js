const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const quickChartBase = 'https://quickchart.io/chart/render/zm-';

bot.onText(/\/analyze (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const crypto = match[1];

  const analysis = {
    positive: 60,
    neutral: 30,
    negative: 10,
    idea: `${crypto}: 60% bullish настроения – разгледай покупка! Tips: ${process.env.ETH_ADDRESS}`
  };

  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{ data: [analysis.positive, analysis.neutral, analysis.negative], backgroundColor: ['#00FF00', '#FFFF00', '#FF0000'] }]
    },
    options: { title: { display: true, text: `${crypto} Sentiment` } }
  };
  const chartUrl = `${quickChartBase}${Buffer.from(JSON.stringify(chartConfig)).toString('base64')}`;

  await bot.sendMessage(chatId, analysis.idea);
  await bot.sendPhoto(chatId, chartUrl);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(chatId, "Пиши /analyze [монета], напр. /analyze BTC");
  }
});

console.log("Bot running...");
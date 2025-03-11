const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const axios = require('axios');
const schedule = require('node-schedule');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const quickChartBase = 'https://quickchart.io/chart';
const GROUP_CHAT_ID = '@Web3ChainLabsAI';

// Функция за топ 20 криптовалути
async function getTop20Cryptos() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 20,
        page: 1,
        sparkline: false
      }
    });
    const coins = response.data;
    let message = `📊 Top 20 Cryptocurrencies (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Market Cap: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    console.error('Error fetching top 20 cryptos:', error.message);
    return 'Unable to fetch top 20 cryptocurrencies.';
  }
}

// Функция за топ 20 мемемойни
async function getTop20MemeCoins() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        category: 'meme-token',
        order: 'market_cap_desc',
        per_page: 20,
        page: 1,
        sparkline: false
      }
    });
    const coins = response.data;
    let message = `😂 Top 20 Meme Coins (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Market Cap: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    console.error('Error fetching top 20 meme coins:', error.message);
    return 'Unable to fetch top 20 meme coins.';
  }
}

// Останалите функции (без промяна)
async function getCryptoPrices() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const prices = response.data;
    return `📈 Current Prices (${new Date().toLocaleString()}):\nBTC: $${prices.bitcoin.usd} | ETH: $${prices.ethereum.usd}`;
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    return 'Price data unavailable.';
  }
}

async function getCryptoNews() {
  try {
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    const news = response.data.Data[0];
    return `📰 ${news.title}\n${news.url}`;
  } catch (error) {
    console.error('Error fetching news:', error.message);
    return 'No news available at the moment.';
  }
}

let lastEthPrice = null;
async function checkPriceSurge() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const currentPrice = response.data.ethereum.usd;
    if (lastEthPrice && Math.abs(currentPrice - lastEthPrice) / lastEthPrice > 0.05) {
      const direction = currentPrice > lastEthPrice ? 'surged' : 'dropped';
      bot.sendMessage(GROUP_CHAT_ID, `⚠️ ETH ${direction} ${((currentPrice - lastEthPrice) / lastEthPrice * 100).toFixed(2)}% in the last 30 min! Now at $${currentPrice}.`);
    }
    lastEthPrice = currentPrice;
  } catch (error) {
    console.error('Error checking price surge:', error.message);
  }
}

async function getCryptoMeme() {
  const memeList = [
    { text: '😂 When ETH pumps during the Blood Moon:', url: 'https://i.imgur.com/crypto-meme1.jpg' },
    { text: '🤔 HODL or sell before the eclipse?', url: 'https://i.imgur.com/crypto-meme2.jpg' },
    { text: '🚀 BTC to the moon!', url: 'https://i.imgur.com/crypto-meme3.jpg' }
  ];
  const meme = memeList[Math.floor(Math.random() * memeList.length)];
  return { caption: meme.text, photo: meme.url };
}

// Автоматични публикации
schedule.scheduleJob('0 * * * *', async () => {
  const news = await getCryptoNews();
  try {
    await bot.sendMessage(GROUP_CHAT_ID, news);
    console.log('News posted to group!');
  } catch (error) {
    console.error('Error posting news:', error.message);
  }
});

schedule.scheduleJob('0 */2 * * *', async () => {
  const prices = await getCryptoPrices();
  bot.sendMessage(GROUP_CHAT_ID, prices);
});

schedule.scheduleJob('*/30 * * * *', checkPriceSurge);

schedule.scheduleJob('0 20 13 3 *', () => {
  bot.sendMessage(GROUP_CHAT_ID, `🌑 Blood Moon Eclipse Now (13 Mar 2025)!\nETH sentiment: 60% bullish! Watch the skies and markets!`);
});

schedule.scheduleJob('0 12 * * *', async () => {
  const meme = await getCryptoMeme();
  try {
    await bot.sendPhoto(GROUP_CHAT_ID, meme.photo, { caption: meme.caption });
    console.log('Meme posted to group!');
  } catch (error) {
    console.error('Error posting meme:', error.message);
  }
});

// Нови графици за топ 20 крипто и мемемойни (всеки ден в 8:00 и 20:00)
schedule.scheduleJob('0 8 * * *', async () => {
  const topCryptos = await getTop20Cryptos();
  bot.sendMessage(GROUP_CHAT_ID, topCryptos);
});

schedule.scheduleJob('0 20 * * *', async () => {
  const topMemeCoins = await getTop20MemeCoins();
  bot.sendMessage(GROUP_CHAT_ID, topMemeCoins);
});

// Команда /analyze
bot.onText(/\/analyze (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const crypto = match[1];
  console.log(`Received /analyze ${crypto} from chat ${chatId}`);

  const analysis = {
    positive: 60,
    neutral: 30,
    negative: 10,
    idea: `${crypto}: 60% bullish sentiment – consider buying! Tips: ${process.env.ETH_ADDRESS}`
  };

  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{ data: [analysis.positive, analysis.neutral, analysis.negative], backgroundColor: ['#00FF00', '#FFFF00', '#FF0000'] }]
    },
    options: { title: { display: true, text: `${crypto} Sentiment` } }
  };
  const chartUrl = `${quickChartBase}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&format=png`;

  try {
    console.log("Sending message...");
    await bot.sendMessage(chatId, analysis.idea);
    console.log("Message sent. Sending photo...");
    await bot.sendPhoto(chatId, chartUrl);
    console.log("Photo sent.");
  } catch (error) {
    console.error("Error:", error.message);
  }
});

// Команда /levels
bot.onText(/\/levels (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const crypto = match[1].toUpperCase();
  const levels = {
    BTC: { support: 73000, resistance: 76000 },
    ETH: { support: 2700, resistance: 2900 }
  };
  const data = levels[crypto] || { support: 'N/A', resistance: 'N/A' };
  const response = `🔍 ${crypto} Technical Analysis:\nSupport: $${data.support} | Resistance: $${data.resistance}`;
  bot.sendMessage(chatId, response);
});

// Команда /poll
bot.onText(/\/poll/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPoll(chatId, 'Will ETH rise after the Blood Moon?', ['Yes', 'No'], { is_anonymous: false });
});

// Команда /bloodmoon
bot.onText(/\/bloodmoon/, (msg) => {
  const chatId = msg.chat.id;
  const response = `🌑 Blood Moon Eclipse on 13-14 Mar 2025!\nWatch ETH – 60% bullish sentiment might spike!`;
  bot.sendMessage(chatId, response);
});

// Отговор на обикновени съобщения
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received message: ${msg.text} from chat ${chatId}`);
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(chatId, "Type /analyze [coin], e.g., /analyze BTC");
  }
});

console.log("Bot running...");
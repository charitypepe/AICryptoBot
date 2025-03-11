const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const schedule = require('node-schedule');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const quickChartBase = 'https://quickchart.io/chart';
const GROUP_CHAT_ID = '@Web3ChainLabsAI';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Функция за AI отговор с OpenAI библиотека
async function getAIResponse(question) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Или 'gpt-3.5-turbo', ако нямаш достъп до gpt-4o-mini
      messages: [
        { role: 'system', content: 'You are a helpful AI that responds in the same language as the question asked.' },
        { role: 'user', content: question }
      ],
      max_tokens: 150,
      temperature: 0.7
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error with AI response:', error.message);
    return 'Sorry, I couldn’t process your question right now.';
  }
}

// Текущи функции (без промяна)
async function getTop20Cryptos() {
  const axios = require('axios');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 20, page: 1, sparkline: false }
    });
    const coins = response.data;
    let message = `📊 Top 20 Cryptocurrencies (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Market Cap: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    return 'Unable to fetch top 20 cryptocurrencies.';
  }
}

async function getTop20MemeCoins() {
  const axios = require('axios');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', category: 'meme-token', order: 'market_cap_desc', per_page: 20, page: 1, sparkline: false }
    });
    const coins = response.data;
    let message = `😂 Top 20 Meme Coins (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Market Cap: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    return 'Unable to fetch top 20 meme coins.';
  }
}

async function getCryptoPrices() {
  const axios = require('axios');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const prices = response.data;
    return `📈 Current Prices (${new Date().toLocaleString()}):\nBTC: $${prices.bitcoin.usd} | ETH: $${prices.ethereum.usd}`;
  } catch (error) {
    return 'Price data unavailable.';
  }
}

async function getCryptoNews() {
  const axios = require('axios');
  try {
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    const news = response.data.Data[0];
    return `📰 ${news.title}\n${news.url}`;
  } catch (error) {
    return 'No news available at the moment.';
  }
}

let lastEthPrice = null;
async function checkPriceSurge() {
  const axios = require('axios');
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
    { text: '🤔 HODL or sell before the eclipse?', url: 'https://i.imgur.com/crypto-meme2.jpg' }
  ];
  const meme = memeList[Math.floor(Math.random() * memeList.length)];
  return { caption: meme.text, photo: meme.url };
}

// Нови функции за публикации
async function getMarketAnalysis() {
  const axios = require('axios');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
    const change = response.data.market_data.price_change_percentage_24h;
    return `📈 Market Analysis (${new Date().toLocaleString()}): Bitcoin ${change > 0 ? 'rose' : 'fell'} by ${change.toFixed(2)}% today – possible reason: new ETF or market volatility.`;
  } catch (error) {
    return '📈 Market Analysis: Couldn’t fetch Bitcoin data today.';
  }
}

function getEducationalContent() {
  const topics = [
    '💡 What is DeFi? Decentralized finance allows...',
    '💡 What is an NFT? A unique digital asset that...',
    '💡 What is staking? It’s the process of locking crypto to...',
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

function sendPoll() {
  bot.sendPoll(GROUP_CHAT_ID, 'Will ETH reach $3000 by the end of March?', ['Yes', 'No'], { is_anonymous: false });
}

function getScamWarning() {
  const scams = [
    '⚠️ Warning: New scam with fake XRP airdrop – don’t share your keys!',
    '⚠️ Beware of phishing: Fake "free BTC" sites are after your passwords!',
  ];
  return scams[Math.floor(Math.random() * scams.length)];
}

function getGameChallenge() {
  return '🎲 Guess which coin grew the most today and win 0.001 ETH! Post your answer here by 20:00 CET.';
}

function getCryptoStory() {
  const stories = [
    '📜 How one trader made $1M from SHIB: Started with $100 in 2020...',
    '📜 Bitcoin’s story: From 1 BTC = $0.0008 to $70K today!',
  ];
  return stories[Math.floor(Math.random() * stories.length)];
}

function getTradingTip() {
  const tips = [
    '📊 Buy at support, sell at resistance – example with BTC: support $70K, resistance $75K.',
    '📊 Don’t chase trends – wait for confirmation before entering a trade!',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

// Поздравление на нови членове
bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() === '-1002452661138') { // ID на @Web3ChainLabsAI
    msg.new_chat_members.forEach((member) => {
      const userId = member.id;
      const welcomeMessage = `Hello, ${member.first_name}! Welcome to @Web3ChainLabsAI! Here you'll find crypto news, analysis, and more!`;
      bot.sendMessage(userId, welcomeMessage)
        .catch(error => console.error(`Couldn’t send DM to ${member.first_name}: ${error.message}`));
    });
  }
});

// Планирани публикации (текущи)
schedule.scheduleJob('0 * * * *', async () => {
  const news = await getCryptoNews();
  bot.sendMessage(GROUP_CHAT_ID, news).catch(error => console.error('Error posting news:', error.message));
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
  bot.sendPhoto(GROUP_CHAT_ID, meme.photo, { caption: meme.caption }).catch(error => console.error('Error posting meme:', error.message));
});

schedule.scheduleJob('0 8 * * *', async () => {
  const topCryptos = await getTop20Cryptos();
  bot.sendMessage(GROUP_CHAT_ID, topCryptos);
});

schedule.scheduleJob('0 20 * * *', async () => {
  const topMemeCoins = await getTop20MemeCoins();
  bot.sendMessage(GROUP_CHAT_ID, topMemeCoins);
});

// Нови планирани публикации
schedule.scheduleJob('0 10 * * *', async () => {
  const analysis = await getMarketAnalysis();
  bot.sendMessage(GROUP_CHAT_ID, analysis);
});

schedule.scheduleJob('0 14 * * *', () => {
  const eduContent = getEducationalContent();
  bot.sendMessage(GROUP_CHAT_ID, eduContent);
});

schedule.scheduleJob('0 16 * * *', () => {
  sendPoll();
});

schedule.scheduleJob('0 12 * * 4', () => {
  const scamWarning = getScamWarning();
  bot.sendMessage(GROUP_CHAT_ID, scamWarning);
});

schedule.scheduleJob('0 18 * * 5', () => {
  const game = getGameChallenge();
  bot.sendMessage(GROUP_CHAT_ID, game);
});

schedule.scheduleJob('0 11 * * 1', () => {
  const story = getCryptoStory();
  bot.sendMessage(GROUP_CHAT_ID, story);
});

schedule.scheduleJob('0 13 * * *', () => {
  const tip = getTradingTip();
  bot.sendMessage(GROUP_CHAT_ID, tip);
});

// Команди
bot.onText(/\/analyze (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const crypto = match[1];
  const analysis = { positive: 60, neutral: 30, negative: 10, idea: `${crypto}: 60% bullish sentiment – consider buying! Tips: ${process.env.ETH_ADDRESS}` };
  const chartConfig = { type: 'pie', data: { labels: ['Positive', 'Neutral', 'Negative'], datasets: [{ data: [analysis.positive, analysis.neutral, analysis.negative], backgroundColor: ['#00FF00', '#FFFF00', '#FF0000'] }] }, options: { title: { display: true, text: `${crypto} Sentiment` } } };
  const chartUrl = `${quickChartBase}?c=${encodeURIComponent(JSON.stringify(chartConfig))}&format=png`;
  await bot.sendMessage(chatId, analysis.idea);
  await bot.sendPhoto(chatId, chartUrl);
});

bot.onText(/\/levels (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const crypto = match[1].toUpperCase();
  const levels = { BTC: { support: 73000, resistance: 76000 }, ETH: { support: 2700, resistance: 2900 } };
  const data = levels[crypto] || { support: 'N/A', resistance: 'N/A' };
  const response = `🔍 ${crypto} Technical Analysis:\nSupport: $${data.support} | Resistance: $${data.resistance}`;
  bot.sendMessage(chatId, response);
});

bot.onText(/\/poll/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPoll(chatId, 'Will ETH rise after the Blood Moon?', ['Yes', 'No'], { is_anonymous: false });
});

bot.onText(/\/bloodmoon/, (msg) => {
  const chatId = msg.chat.id;
  const response = `🌑 Blood Moon Eclipse on 13-14 Mar 2025!\nWatch ETH – 60% bullish sentiment might spike!`;
  bot.sendMessage(chatId, response);
});

// AI отговори
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received message: ${msg.text} from chat ${chatId}`);
  if (msg.text && !msg.text.startsWith('/')) {
    const aiResponse = await getAIResponse(msg.text);
    bot.sendMessage(chatId, `🤖 ${aiResponse}`);
  } else if (msg.text && !msg.text.match(/\/(analyze|levels|poll|bloodmoon)/)) {
    bot.sendMessage(chatId, "Type /analyze [coin], /levels [coin], /poll, or /bloodmoon");
  }
});

console.log("Bot running...");
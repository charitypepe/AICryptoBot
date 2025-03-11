const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const schedule = require('node-schedule');
const OpenAI = require('openai');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const quickChartBase = 'https://quickchart.io/chart';
const GROUP_CHAT_ID = '@Web3ChainLabsAI';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Функция за AI отговор с разширена логика
async function getAIResponse(question) {
  const lowerQuestion = question.toLowerCase();
  try {
    if (lowerQuestion.includes('цена') && lowerQuestion.includes('биткойн')) {
      console.log('Using CoinGecko for prices');
      const prices = await getCryptoPrices();
      return `Ето актуалните цени: ${prices}`;
    } else if (lowerQuestion.includes('топ') && lowerQuestion.includes('крипто')) {
      const topCryptos = await getTop20Cryptos();
      return `Ето топ 20 криптовалути: ${topCryptos}`;
    } else if (lowerQuestion.includes('времето')) {
      const city = lowerQuestion.split(' ').pop() || 'Sofia';
      const weather = await getWeather(city);
      return `Ето времето: ${weather}`;
    } else if (lowerQuestion.includes('прогноз') || lowerQuestion.includes('bitcoin')) {
      const prediction = await getMarketPrediction();
      return `🤖 ${prediction}`;
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful AI that responds in the same language as the question asked. Today's date is ${new Date().toLocaleString()}. If you don’t have real-time data, say so and suggest where to find it.` },
          { role: 'user', content: question }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      return completion.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('Error with AI response:', error.message);
    return 'Съжалявам, не можах да обработя въпроса ти сега.';
  }
}

// Нова функция за пазарна прогноза
async function getMarketPrediction() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: { vs_currency: 'usd', days: '7' } // 7-дневни данни
    });
    const prices = response.data.prices; // Масив от [timestamp, price]
    const currentPrice = prices[prices.length - 1][1];
    const pastPrices = prices.slice(-7).map(p => p[1]); // Последните 7 точки
    const avgPrice = pastPrices.reduce((a, b) => a + b, 0) / pastPrices.length; // Средна цена за 7 дни
    const trend = currentPrice > avgPrice ? 'възходящ' : 'низходящ';
    const change24h = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin').then(res => res.data.market_data.price_change_percentage_24h);

    let prediction;
    if (trend === 'възходящ' && change24h > 0) {
      prediction = `Прогноза за Биткойн: Цената ($ ${currentPrice.toLocaleString()}) е в ${trend} тренд. Средната цена за 7 дни е $ ${avgPrice.toLocaleString()}. Въз основа на 24-часовия ръст (${change24h.toFixed(2)}%), вероятно ще продължи да расте в краткосрочен план.`;
    } else if (trend === 'низходящ' && change24h < 0) {
      prediction = `Прогноза за Биткойн: Цената ($ ${currentPrice.toLocaleString()}) е в ${trend} тренд. Средната цена за 7 дни е $ ${avgPrice.toLocaleString()}. Въз основа на 24-часовия спад (${change24h.toFixed(2)}%), може да продължи да пада скоро.`;
    } else {
      prediction = `Прогноза за Биткойн: Цената ($ ${currentPrice.toLocaleString()}) е около средната за 7 дни ($ ${avgPrice.toLocaleString()}). Пазарът е нестабилен с 24-часова промяна ${change24h.toFixed(2)}%. Трудно е да се предвиди ясно движение.`;
    }
    return `${prediction}\n📊 Провери повече на https://www.coingecko.com/en/coins/bitcoin`;
  } catch (error) {
    console.error('Error fetching market prediction:', error.message);
    return 'Не можах да направя прогноза за пазара сега.';
  }
}

// Останалите функции (без промяна)
async function getWeather(city) {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
    const weather = response.data;
    return `🌤️ Времето в ${city} днес (${new Date().toLocaleString()}):\nТемпература: ${weather.main.temp}°C\nУсеща се като: ${weather.main.feels_like}°C\nОписание: ${weather.weather[0].description}\nВлажност: ${weather.main.humidity}%`;
  } catch (error) {
    return 'Не можах да взема данни за времето.';
  }
}

async function getTop20Cryptos() {
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
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const prices = response.data;
    return `📈 Current Prices (${new Date().toLocaleString()}):\nBTC: $${prices.bitcoin.usd} | ETH: $${prices.ethereum.usd}`;
  } catch (error) {
    return 'Price data unavailable.';
  }
}

async function getCryptoNews() {
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

async function getMarketAnalysis() {
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
  if (chatId.toString() === '-1002452661138') {
    msg.new_chat_members.forEach((member) => {
      const userId = member.id;
      const welcomeMessage = `Hello, ${member.first_name}! Welcome to @Web3ChainLabsAI! Here you'll find crypto news, analysis, and more!`;
      bot.sendMessage(userId, welcomeMessage)
        .catch(error => console.error(`Couldn’t send DM to ${member.first_name}: ${error.message}`));
    });
  }
});

// Планирани публикации
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

// Добавяне на автоматична прогноза всеки ден в 15:00
schedule.scheduleJob('0 15 * * *', async () => {
  const prediction = await getMarketPrediction();
  bot.sendMessage(GROUP_CHAT_ID, `📈 Дневна прогноза:\n${prediction}`);
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
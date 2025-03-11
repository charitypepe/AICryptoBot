const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const axios = require('axios');
const schedule = require('node-schedule');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const quickChartBase = 'https://quickchart.io/chart';
const GROUP_CHAT_ID = '@Web3ChainLabsAI';

// Функция за AI отговор чрез OpenAI
async function getAIResponse(question) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful AI that responds in the same language as the question asked.' },
        { role: 'user', content: question }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}',
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error with AI response:', error.message);
    return 'Съжалявам, не можах да обработя въпроса ти сега.';
  }
}

// Текущи функции (без промяна)
async function getTop20Cryptos() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 20, page: 1, sparkline: false }
    });
    const coins = response.data;
    let message = `📊 Топ 20 криптовалути (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Пазарна капитализация: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    return 'Не можах да взема топ 20 криптовалути.';
  }
}

async function getTop20MemeCoins() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', category: 'meme-token', order: 'market_cap_desc', per_page: 20, page: 1, sparkline: false }
    });
    const coins = response.data;
    let message = `😂 Топ 20 мемемойни (${new Date().toLocaleString()}):\n`;
    coins.forEach((coin, index) => {
      message += `${index + 1}. ${coin.symbol.toUpperCase()}: $${coin.current_price} (Пазарна капитализация: $${coin.market_cap.toLocaleString()})\n`;
    });
    return message;
  } catch (error) {
    return 'Не можах да взема топ 20 мемемойни.';
  }
}

async function getCryptoPrices() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const prices = response.data;
    return `📈 Текущи цени (${new Date().toLocaleString()}):\nBTC: $${prices.bitcoin.usd} | ETH: $${prices.ethereum.usd}`;
  } catch (error) {
    return 'Данните за цените не са налични.';
  }
}

async function getCryptoNews() {
  try {
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    const news = response.data.Data[0];
    return `📰 ${news.title}\n${news.url}`;
  } catch (error) {
    return 'Няма налични новини в момента.';
  }
}

let lastEthPrice = null;
async function checkPriceSurge() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const currentPrice = response.data.ethereum.usd;
    if (lastEthPrice && Math.abs(currentPrice - lastEthPrice) / lastEthPrice > 0.05) {
      const direction = currentPrice > lastEthPrice ? 'повиши' : 'падна';
      bot.sendMessage(GROUP_CHAT_ID, `⚠️ ETH ${direction} с ${((currentPrice - lastEthPrice) / lastEthPrice * 100).toFixed(2)}% за последните 30 мин! Сега е $${currentPrice}.`);
    }
    lastEthPrice = currentPrice;
  } catch (error) {
    console.error('Error checking price surge:', error.message);
  }
}

async function getCryptoMeme() {
  const memeList = [
    { text: '😂 Когато ETH скочи по време на Blood Moon:', url: 'https://i.imgur.com/crypto-meme1.jpg' },
    { text: '🤔 Да държа или да продам преди затъмнението?', url: 'https://i.imgur.com/crypto-meme2.jpg' }
  ];
  const meme = memeList[Math.floor(Math.random() * memeList.length)];
  return { caption: meme.text, photo: meme.url };
}

// Нови функции за публикации
async function getMarketAnalysis() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
    const change = response.data.market_data.price_change_percentage_24h;
    return `📈 Анализ на пазара (${new Date().toLocaleString()}): Биткойн ${change > 0 ? 'скочи' : 'падна'} с ${change.toFixed(2)}% днес – възможна причина е нов ETF или пазарна волатилност.`;
  } catch (error) {
    return '📈 Анализ на пазара: Не можах да взема данни за Биткойн днес.';
  }
}

function getEducationalContent() {
  const topics = [
    '💡 Какво е DeFi? Децентрализираните финанси позволяват...',
    '💡 Какво е NFT? Уникален цифров актив, който...',
    '💡 Какво е staking? Това е процес на заключване на крипто за...',
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

function sendPoll() {
  bot.sendPoll(GROUP_CHAT_ID, 'Ще достигне ли ETH $3000 до края на март?', ['Да', 'Не'], { is_anonymous: false });
}

function getScamWarning() {
  const scams = [
    '⚠️ Внимание: Нов scam с фалшив airdrop за XRP – не споделяйте ключове!',
    '⚠️ Внимавайте с фишинг: Лъжливи сайтове за "безплатен BTC" искат пароли!',
  ];
  return scams[Math.floor(Math.random() * scams.length)];
}

function getGameChallenge() {
  return '🎲 Познай коя монета е нараснала най-много днес и спечели 0.001 ETH! Пиши отговора си тук до 20:00 CET.';
}

function getCryptoStory() {
  const stories = [
    '📜 Как един трейдър спечели $1M от SHIB: Започна с $100 през 2020...',
    '📜 Историята на Биткойн: От 1 BTC = $0.0008 до $70K днес!',
  ];
  return stories[Math.floor(Math.random() * stories.length)];
}

function getTradingTip() {
  const tips = [
    '📊 Купувай на подкрепа, продавай на съпротива – ето пример с BTC: подкрепа $70K, съпротива $75K.',
    '📊 Не гони трендове – чакай потвърждение преди да влезеш в сделка!',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

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
  bot.sendMessage(GROUP_CHAT_ID, `🌑 Лунно затъмнение Blood Moon сега (13 март 2025)!\nНастроения за ETH: 60% бичи! Гледай небето и пазарите!`);
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

// Команди (без промяна)
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
  const response = `🔍 ${crypto} Технически анализ:\nПодкрепа: $${data.support} | Съпротива: $${data.resistance}`;
  bot.sendMessage(chatId, response);
});

bot.onText(/\/poll/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPoll(chatId, 'Ще се покачи ли ETH след Blood Moon?', ['Да', 'Не'], { is_anonymous: false });
});

bot.onText(/\/bloodmoon/, (msg) => {
  const chatId = msg.chat.id;
  const response = `🌑 Лунно затъмнение Blood Moon на 13-14 март 2025!\nГледай ETH – 60% bullish sentiment може да скочи!`;
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
    bot.sendMessage(chatId, "Пиши /analyze [монета], /levels [монета], /poll или /bloodmoon");
  }
});

console.log("Bot running...");
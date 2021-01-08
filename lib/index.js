const bot = require('./bot');
const logger = require('./logger');

const { API_GW_URL } = process.env;

const setBotUsername = async (botInstance) => {
  const botInfo = await botInstance.telegram.getMe();
  // eslint-disable-next-line no-param-reassign
  botInstance.options.username = botInfo.username.toLowerCase();
  // eslint-disable-next-line no-param-reassign
  botInstance.context.botInfo = botInfo;

  logger.info(`Bot username is set to ${botInstance.options.username}`);
};

module.exports.webhook = async (event) => {
  await setBotUsername(bot);
  await bot.handleUpdate(event.body);
};

module.exports.setWebhook = async () => {
  try {
    await bot.telegram.setWebhook(`${API_GW_URL}/webhook`, undefined, undefined, ['message']);
    logger.info('Webhook successfully set');
  } catch (error) {
    logger.error(error.description);
    logger.error(error);
  }
};

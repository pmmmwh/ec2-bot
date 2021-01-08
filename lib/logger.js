const pino = require('pino');

const logger = pino({
  base: null,
  name: 'ec2-bot',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

module.exports = logger;

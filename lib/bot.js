// This is provided by AWS within the Lambda runtime
// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');
const Telegraf = require('telegraf');
const anyCase = require('telegraf-anycase-commands');
const commandParts = require('telegraf-command-parts');
const { AUTHORIZED_IDS, STATUS_MAPPING } = require('./constants');
const logger = require('./logger');
const { groupBy, startCase } = require('./utils');

const { INSTANCE_ID, TG_BOT_TOKEN } = process.env;

const bot = new Telegraf(TG_BOT_TOKEN);
const ec2 = new AWS.EC2();

bot.use(anyCase.lowercase());
bot.use(commandParts());
bot.use(({ from: { id }, reply }, next) => {
  return AUTHORIZED_IDS.includes(id) ? next() : reply('Unauthorized!');
});

bot.command(
  'id',
  Telegraf.privateChat(async ({ from: { id: userId }, replyWithMarkdown }) => {
    return replyWithMarkdown(`*Your Telegram ID*\n\`${userId}\``);
  })
);

bot.command(
  'list',
  Telegraf.privateChat(async ({ reply, replyWithMarkdown }) => {
    try {
      const { Reservations } = await ec2
        .describeInstances({
          Filters: [
            {
              Name: 'tag:Project',
              Values: ['Cloud Gaming'],
            },
          ],
        })
        .promise();

      const instances = Reservations.reduce((acc, { Instances }) => {
        acc.push(...Instances);
        return acc;
      }, []);
      return replyWithMarkdown(
        instances
          ? [
              '*Available Instances*',
              Array.from(groupBy(instances, ({ State: { Name } }) => startCase(Name)).entries())
                .sort(([stateA], [stateB]) => {
                  const order = STATUS_MAPPING.keys();
                  return order.indexOf(stateA) - order.indexOf(stateB);
                })
                .map(([state, statuses]) =>
                  statuses.reduce(
                    (acc, { InstanceId, InstanceType }) =>
                      [acc, `\`${InstanceId}\` - ${InstanceType}`].join('\n'),
                    `${STATUS_MAPPING.get(state)} *${state}*`
                  )
                )
                .join('\n\n'),
            ].join('\n')
          : 'No instances available!'
      );
    } catch (error) {
      logger.error(error.message);
      logger.error(error);
      return reply('An error occurred while listing instances.');
    }
  })
);

bot.command(
  'boot',
  Telegraf.privateChat(async ({ reply, replyWithMarkdown }) => {
    try {
      const { StartingInstances } = await ec2
        .startInstances({
          InstanceIds: [INSTANCE_ID],
        })
        .promise();

      const curStatus = startCase(StartingInstances[0].CurrentState.Name);
      await replyWithMarkdown(
        [
          `Starting instance: \`${INSTANCE_ID}\``,
          `Current state: *${STATUS_MAPPING.get(curStatus)} ${curStatus}*`,
        ].join('\n')
      );

      await ec2
        .waitFor('instanceStatusOk', {
          InstanceIds: [INSTANCE_ID],
        })
        .promise();
      return replyWithMarkdown(`Instance \`${INSTANCE_ID}\` successfully started.`);
    } catch (error) {
      logger.error(error.message);
      logger.error(error);
      return reply('An error occurred while starting instance.');
    }
  })
);

bot.command(
  'shutdown',
  Telegraf.privateChat(async ({ reply, replyWithMarkdown }) => {
    try {
      const { StoppingInstances } = await ec2
        .stopInstances({
          InstanceIds: [process.env.INSTANCE_ID],
        })
        .promise();

      const curStatus = startCase(StoppingInstances[0].CurrentState.Name);
      await replyWithMarkdown(
        [
          `Stopping instance: \`${INSTANCE_ID}\``,
          `Current state: *${STATUS_MAPPING.get(curStatus)} ${curStatus}*`,
        ].join('\n')
      );

      await ec2
        .waitFor('instanceStopped', {
          Filters: [
            {
              Name: 'instance-id',
              Values: [INSTANCE_ID],
            },
          ],
        })
        .promise();
      return replyWithMarkdown(`Instance \`${INSTANCE_ID}\` successfully stopped.`);
    } catch (error) {
      logger.error(error.message);
      logger.error(error);
      return reply('An error occurred while stopping instance.');
    }
  })
);

module.exports = bot;

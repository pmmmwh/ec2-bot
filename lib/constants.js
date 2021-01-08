const AUTHORIZED_IDS = process.env.AUTHORIZED_IDS.split(',').map((id) => parseInt(id, 10));

const STATUS_MAPPING = new Map([
  ['Running', '🟢'],
  ['Pending', '🟡'],
  ['Shutting Down', '🟡'],
  ['Stopping', '🟡'],
  ['Stopped', '🟠'],
  ['Terminated', '🟠'],
]);

module.exports = { AUTHORIZED_IDS, STATUS_MAPPING };

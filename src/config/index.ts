import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const DEFAULT_PORT = '3000';

export default {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT || DEFAULT_PORT, 10),

  /**
   * That long string from mongo atlas
   */
  databaseURL: process.env.MONGODB_URI,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL,
  },

  /**
   * API configs
   */
  api: {
    prefix: '/api',
  },
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'wss://kusama-rpc.polkadot.io',

  crawlers: [
    {
      enabled: process.env.CRAWLER_ERA_POINTS_HISTORY_ENABLE,
      module: require('../services/crawlers/historyData'),
    },
    {
      enabled: process.env.CRAWLER_NOMINATOR_HISTORY_ENABLE,
      module: require('../services/crawlers/nominatorsHistoryData'),
    },
    {
      enabled: process.env.CRAWLER_TOTAL_REWARD_HISTORY,
      module: require('../services/crawlers/historyTotalRewards'),
    },
    {
      enabled: process.env.CRAWLER_ACCOUNT_IDENTITY,
      module: require('../services/crawlers/accountIdentity'),
    },
    {
      enabled: process.env.CRAWLER_NEXT_ELECTED,
      module: require('../services/crawlers/nextElected'),
    },
    {
      enabled: process.env.CRAWLER_SESSION_VALIDATORS_ENABLED,
      module: require('../services/crawlers/sessionValidators'),
    },
    {
      enabled: process.env.CRAWLER_ACTIVE_NOMINATORS_ENABLED,
      module: require('../services/crawlers/activeNominators'),
    },
  ],
};

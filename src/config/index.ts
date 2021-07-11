import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const DEFAULT_PORT = '5000';

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
   * Used by winston logger
   */
  domain: {
    level: process.env.domain,
  },

  /**
   * API configs
   */
  api: {
    prefix: '/api',
  },
  wsProviderUrl: process.env.WS_KUSAMA_PROVIDER_URL,

  networks: [
    {
      name: 'polkadot',
      wsProviderUrl: process.env.WS_POLKADOT_PROVIDER_URL,
      decimalPlaces: 10,
      erasPerDay: 1,
      lockUpPeriod: 28,
      maxNomAllowed: 256,
      testnet: false,
    },
    {
      name: 'kusama',
      wsProviderUrl: process.env.WS_KUSAMA_PROVIDER_URL,
      decimalPlaces: 12,
      erasPerDay: 4,
      lockUpPeriod: 7,
      maxNomAllowed: 128,
      testnet: false,
    },
    {
      name: 'westend',
      wsProviderUrl: process.env.WS_WESTEND_PROVIDER_URL,
      decimalPlaces: 12,
      erasPerDay: 4,
      lockUpPeriod: 7,
      maxNomAllowed: 128,
      testnet: true,
    },
  ],
};

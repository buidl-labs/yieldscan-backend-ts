import 'reflect-metadata'; // We need this in order to use @Decorators

import express from 'express';

import config from './config';

import Logger from './loaders/logger';

import loaders from './loaders';

async function startServer() {
  const app = express();

  await loaders({ expressApp: app });

  app.listen(config.port, err => {
    if (err) {
      Logger.error(err);
      process.exit(1);
      return;
    }
    Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ################################################
    `);
  });
}

startServer();

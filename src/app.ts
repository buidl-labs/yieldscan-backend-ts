import 'reflect-metadata'; // We need this in order to use @Decorators

import express from 'express';

import config from './config';

import Logger from './loaders/logger';

import loaders from './loaders';

import { Container } from 'typedi';
import GetPolkaData from './services/getPolkaData';

async function startCrawlers() {
  Logger.info('starting crawlers');
  const getPolkaDataInstance = Container.get(GetPolkaData);
  await getPolkaDataInstance.runCrawlers();
}

startCrawlers();

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
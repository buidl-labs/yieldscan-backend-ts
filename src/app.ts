import 'reflect-metadata'; // We need this in order to use @Decorators

import express from 'express';

import config from './config';

import Logger from './loaders/logger';

import loaders from './loaders';

import { Container } from 'typedi';
import GetPolkaData from './services/getPolkaData';

async function startCrawlers() {
  await loaders();
  Logger.info('starting crawlers');
  const getPolkaDataInstance = Container.get(GetPolkaData);
  await getPolkaDataInstance.runCrawlers();
}

startCrawlers().catch((error) => {
  Logger.error(error);
  process.exit(1);
});

async function startServer() {
  const app = express();

  app.listen(config.port, (err) => {
    if (err) {
      Logger.error(err);
      process.exit(1);
    }
    Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ################################################
    `);
  });
}

startServer();

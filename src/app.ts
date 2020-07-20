import 'reflect-metadata'; // We need this in order to use @Decorators

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

startCrawlers();

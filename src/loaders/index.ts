import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import Logger from './logger';
// We have to import at least all the events once so they can be triggered
import './events';

export default async ({ expressApp }) => {
  const mongoConnection = await mongooseLoader();
  Logger.info('✌️ DB loaded and connected!');

  /**
   * WTF is going on here?
   *
   * We are injecting the mongoose models into the DI container.
   * I know this is controversial but will provide a lot of flexibility at the time
   * of writing unit tests, just go and check how beautiful they are!
   */

  const models = [
    {
      name: 'NextElected',
      // Notice the require syntax and the '.default'
      model: require('../models/nextElected').default,
    },
    {
      name: 'ValidatorHistory',
      // Notice the require syntax and the '.default'
      model: require('../models/validatorHistory').default,
    },
  ];

  await dependencyInjectorLoader({
    mongoConnection,
    models,
  });

  Logger.info('✌️ Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};

import 'reflect-metadata';
import { Service, Inject, Container } from 'typedi';
import { ApiPromise, WsProvider } from '@polkadot/api';
import config from '../config';
import { wait } from './utils';
Container.set('config', config);

@Service()
export default class GetPolkaData {
  @Inject('config')
  config;
  async runCrawlers() {
    const api = await this.getPolkadotAPI();

    // logger.info('Running crawlers');
    // logger.info(this.config.crawlers)

    const crawlers = this.config.crawlers.filter((crawler) => crawler.enabled == 'true');
    // crawlers.forEach((crawler) => crawler.module.start(api));
    this.start(api, crawlers);
  }

  async start(api, crawlers) {
    const Logger = Container.get('logger');
    for (let i = 0; i < crawlers.length; i++) {
      await crawlers[i].module.start(api);
      await wait(5000);
    }
    Logger.info('wating 30 secs');
    await wait(30000);
    return this.start(api, crawlers);
  }

  async getPolkadotAPI() {
    const Logger = Container.get('logger');
    const provider = new WsProvider(this.config.wsProviderUrl);
    provider.on('error', async () => {
      Logger.error('Error: API crashed');
      process.exit(1);
    });
    const api = await ApiPromise.create({ provider });
    try {
      await api.isReady;
      Logger.info('API is ready!');
    } catch (error) {
      Logger.error('Error', error);
    }
    return api;
  }
}

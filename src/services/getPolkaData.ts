import 'reflect-metadata';
import { Service, Inject, Container } from 'typedi';
import { ApiPromise, WsProvider } from '@polkadot/api';
import config from '../config';
import { wait } from './utils';
import { start } from 'repl';
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
    console.log('crawlers', crawlers);
    // crawlers.forEach((crawler) => crawler.module.start(api));
    this.start(api, crawlers);
  }

  async start(api, crawlers) {
    const Logger = Container.get('logger');
    for (let i = 0; i < crawlers.length; i++) {
      await crawlers[i].module.start(api);
      await wait(5000);
    }
    Logger.info('wating 15 secs');
    await wait(15000);
    return this.start(api, crawlers);
  }

  async getPolkadotAPI() {
    // logger.info(`Connecting to ${this.config.wsProviderUrl}`);

    const provider = new WsProvider(this.config.wsProviderUrl);
    provider.on('error', () => {
      console.log('Error: API');
    });
    const api = await ApiPromise.create({ provider });
    try {
      await api.isReady;
      console.log('API is ready!');
    } catch (error) {
      console.log('Error', error);
    }
    return api;
  }
}

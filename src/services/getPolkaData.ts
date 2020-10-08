import 'reflect-metadata';
import { Service, Inject, Container } from 'typedi';
import { ApiPromise, WsProvider } from '@polkadot/api';
import config from '../config';
import { wait } from './utils';
import Logger from '../loaders/logger';
Container.set('config', config);

@Service()
export default class GetPolkaData {
  @Inject('config')
  config;
  async runCrawlers() {
    const crawlers = this.config.crawlers.filter((crawler) => crawler.enabled == 'true');
    const networks = this.config.networks;
    console.log(networks);

    await this.startMultipleCrawlers(networks, crawlers);
    // crawlers.forEach((crawler) => crawler.module.start(api));
  }

  async startMultipleCrawlers(networks, crawlers) {
    // api.on('error', async () => {
    //   Logger.error('Error: API crashed');
    //   await api.dissconnect();
    //   process.exit(1);
    // });
    for (let i = 0; i < networks.length; i++) {
      Logger.info('Network: ' + networks[i].name);
      await this.start(crawlers, networks[i]);
      Logger.info('wating 60 secs');
      await wait(60000);
    }

    // networks.map(async (network) => {
    //   await this.start(crawlers, network);
    // });

    return await this.startMultipleCrawlers(networks, crawlers);
  }

  async start(crawlers, network) {
    const api = await this.getPolkadotAPI(network.wsProviderUrl);
    for (let i = 0; i < crawlers.length; i++) {
      await crawlers[i].module.start(api, network.name);
      await wait(5000);
    }

    return;
  }

  async getPolkadotAPI(wsProviderUrl) {
    const provider = new WsProvider(wsProviderUrl, false);
    await provider.connect();
    const api = await ApiPromise.create({ provider });
    api.on('error', async () => {
      Logger.error('Error: API crashed');
      await api.disconnect();
      process.exit(1);
    });
    api.on('disconnected', async () => {
      Logger.error('API has been disconnected from the endpoint');
      // await api.disconnect();
      process.exit(1);
    });
    try {
      await api.isReady;
      Logger.info('API is ready!');
    } catch (error) {
      Logger.error('Error', error);
    }
    return api;
  }
}

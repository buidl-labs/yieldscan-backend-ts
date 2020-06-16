import "reflect-metadata";
import {Service, Inject, Container} from "typedi";
import  { ApiPromise, WsProvider } from '@polkadot/api'
import config from '../config'
Container.set("config", config);

@Service()
export default class GetPolkaData {
    @Inject("config")
    config: any;
  
    async runCrawlers() {
        // logger.info('Getting PolkaData, waiting 15s...');
        // await wait(15000);
    
        // const pool = await this.getPool();
    
        let api = await this.getPolkadotAPI();
    
        // logger.info('Running crawlers');
        // logger.info(this.config.crawlers)
    
        this.config.crawlers
          .filter(crawler => crawler.enabled)
          .forEach(crawler => crawler.module.start(api));
      }
  
      async getPolkadotAPI() {
        // logger.info(`Connecting to ${this.config.wsProviderUrl}`);
    
        const provider = new WsProvider(this.config.wsProviderUrl);
        const api = await ApiPromise.create({ provider });
        try {
            await api.isReady;
            console.log('API is ready!');
        
        } catch (error) {
            console.log('Error', error)
        }
        return api;
      }
  }
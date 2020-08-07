import { Container } from 'typedi';

import { wait } from '../utils';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import mongoose from 'mongoose';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start historyTotalRewads');
    const TotalRewardHistory = Container.get('TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const eraIndex = await module.exports.getEraIndexes(api, TotalRewardHistory);
    // Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      const rewards = await module.exports.getRewards(api, eraIndex);
      if (rewards.length !== 0) {
        try {
          await TotalRewardHistory.insertMany(rewards);
        } catch (error) {
          Logger.error('Caught error while updating total reward ', error);
        }
      }
    }
    Logger.info('stop historyTotalRewards');
    return;
  },

  getRewards: async function (api, eraIndex) {
    const Logger = Container.get('logger');
    Logger.info('get Rewards');
    try {
      const rewards = await Promise.all(
        eraIndex.map(async (i) => {
          const reward = await api.query.staking.erasValidatorReward(i);
          if (reward.toJSON() !== null) {
            return { eraIndex: i, eraTotalReward: parseInt(reward) };
          } else {
            return null;
          }
        }),
      );
      const result = rewards.filter((i) => i !== null);
      return result;
    } catch (error) {
      Logger.error('caught error while fetching historyTotalReward. Retrying in 5s', error);
      await wait(5000);
      await module.exports.getRewards(api, eraIndex);
    }
  },

  getEraIndexes: async function (api, TotalRewardHistory) {
    // get the latest eraIndex from the DB
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    // Logger.debug(lastIndexDB);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = Math.max(1, currentEra - historyDepth);
    // Logger.debug(lastAvailableEra);

    // check whether there is any previous data available inside the DB
    if (lastIndexDB.length !== 0) {
      // check whether available eraIndex from DB is not very old
      if (lastIndexDB[0].eraIndex >= lastAvailableEra) {
        const indexCount = currentEra - lastIndexDB[0].eraIndex - 1;
        const eraIndex = [...Array(indexCount).keys()].map((i) => i + (lastIndexDB[0].eraIndex + 1));
        return eraIndex;
      }
    }
    const eraIndex = [...Array(historyDepth.toNumber()).keys()].map((i) => i + lastAvailableEra);
    return eraIndex;
  },
};

import { Container } from 'typedi';

import TotalRewardHistory from '../../models/totalRewardHistory';
import { wait } from '../utils';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start historyTotalRewads');
    const eraIndex = await module.exports.getEraIndexes(api);
    Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      const rewards = await module.exports.getRewards(api, eraIndex);
      const rewardsWithEraIndex = eraIndex.map((x, index) => {
        const totalReward = rewards[index];
        if (totalReward !== null) {
          return {
            eraTotalReward: totalReward,
            eraIndex: x,
          };
        }
      });
      await TotalRewardHistory.insertMany(rewardsWithEraIndex);
    }
    console.log('stop historyData');
  },
  getRewards: async function (api, eraIndex) {
    try {
      const rewards = await Promise.all(eraIndex.map((i) => api.query.staking.erasValidatorReward(i)));
      return rewards;
    } catch (error) {
      console.log('caught error while fetching pointsHistoryWithTotalReward. Retrying in 15s');
      await wait(15000);
      await module.exports.getRewards(api, eraIndex);
    }
  },

  getEraIndexes: async function (api) {
    const Logger = Container.get('logger');
    // get the latest eraIndex from the DB
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    Logger.debug(lastIndexDB);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = currentEra - historyDepth;
    Logger.debug(lastAvailableEra);

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

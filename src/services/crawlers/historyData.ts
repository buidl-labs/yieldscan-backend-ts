import { Container } from 'typedi';
import mongoose from 'mongoose';

import { wait, chunkArray } from '../utils';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

module.exports = {
  start: async function (api, networkName) {
    const Logger = Container.get('logger');
    Logger.info('start historyData');
    const ValidatorHistory = Container.get(networkName + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;

    const eraIndex = await module.exports.getEraIndexes(api, ValidatorHistory);
    // Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      await module.exports.storeValidatorHistory(api, eraIndex, ValidatorHistory);
    }
    Logger.info('stop historyData');
    return;
  },

  getSlashes: async function (api, pointsHistory) {
    const slashes = {};
    for (let i = 0; i < pointsHistory.length; i++) {
      const individuals = Object.keys(pointsHistory[i].erasRewardPoints.individual).filter(
        (x) => !Object.keys(slashes).includes(x),
      );

      const slashInfo = [];

      const chunkedArr = chunkArray(individuals, 100);

      for (let j = 0; j < chunkedArr.length; j++) {
        const info = await Promise.all(chunkedArr[j].map((val) => api.derive.staking.ownSlashes(val)));
        slashInfo.push(...info);
      }

      individuals.map((x, index) => {
        slashes[x] = slashInfo[index];
      });
    }
    return slashes;
  },

  getEraIndexes: async function (api, ValidatorHistory) {
    // const Logger = Container.get('logger');
    const lastIndexDB = await ValidatorHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = Math.max(1, currentEra - historyDepth);
    // Logger.debug('lastAvailableEra', lastAvailableEra);

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

  storeValidatorHistory: async function (api, eraIndex, ValidatorHistory) {
    const Logger = Container.get('logger');
    const erasRewardPointsArr = await Promise.all(eraIndex.map(async (i) => api.query.staking.erasRewardPoints(i)));
    const pointsHistory = eraIndex.map((i, index) => {
      return { eraIndex: i, erasRewardPoints: erasRewardPointsArr[index].toJSON() };
    });

    Logger.info('getting slash info');
    const slashes = await module.exports.getSlashes(api, pointsHistory);

    Logger.info('getting val exposure and prefs');
    for (let i = 0; i < pointsHistory.length; i++) {
      const rewards: Array<IValidatorHistory> = [];

      const chunkedArr = chunkArray(Object.keys(pointsHistory[i].erasRewardPoints.individual), 100);

      const valExposure2 = [];
      const valPrefs2 = [];
      for (let j = 0; j < chunkedArr.length; j++) {
        const chunkExposure = await Promise.all(
          chunkedArr[j].map((x) => api.query.staking.erasStakers(pointsHistory[i].eraIndex, x.toString())),
        );

        valExposure2.push(...chunkExposure);

        const chunkPrefs = await Promise.all(
          chunkedArr[j].map((x) => api.query.staking.erasValidatorPrefs(pointsHistory[i].eraIndex, x.toString())),
        );

        valPrefs2.push(...chunkPrefs);
      }

      Logger.info('waiting 5s');
      await wait(5000);

      Object.keys(pointsHistory[i].erasRewardPoints.individual).forEach((y, index) => {
        const nominatorsInfo = valExposure2[index].others.map((x) => {
          const nomId = x.who.toString();
          return {
            nomId: nomId,
            nomStake: parseInt(x.value),
          };
        });
        const slashInfo = slashes[y].filter((x) => parseInt(x.era) == pointsHistory[i].eraIndex);
        rewards.push({
          stashId: y,
          commission: parseInt(valPrefs2[index].commission),
          eraIndex: pointsHistory[i].eraIndex,
          eraPoints: pointsHistory[i].erasRewardPoints.individual[y],
          totalEraPoints: pointsHistory[i].erasRewardPoints.total,
          totalStake: parseInt(valExposure2[index].total),
          nominatorsInfo: nominatorsInfo,
          slashCount: slashInfo[0] !== undefined ? parseInt(slashInfo[0].total) : 0,
        });
      });

      // insert data into DB
      if (rewards.length > 0) {
        try {
          await ValidatorHistory.insertMany(rewards);
        } catch (error) {
          Logger.error('Error while updating validator history data', error);
        }
      }
    }
    return;
  },
};

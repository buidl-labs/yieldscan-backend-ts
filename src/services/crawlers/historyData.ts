import { Container } from 'typedi';
import mongoose from 'mongoose';

import { wait } from '../utils';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start historyData');
    const eraIndex = await module.exports.getEraIndexes(api);
    // Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      await module.exports.storeValidatorHistory(api, eraIndex);
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
      const slashInfo = await Promise.all(individuals.map((val) => api.derive.staking.ownSlashes(val)));
      individuals.map((x, index) => {
        slashes[x] = slashInfo[index];
      });
    }
    return slashes;
  },

  getEraIndexes: async function (api) {
    // const Logger = Container.get('logger');
    const ValidatorHistory = Container.get('ValidatorHistory') as mongoose.Model<IValidatorHistory & mongoose.Document>;
    const lastIndexDB = await ValidatorHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    // Logger.debug(lastIndexDB);
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

  storeValidatorHistory: async function (api, eraIndex) {
    const Logger = Container.get('logger');
    const erasRewardPointsArr = await Promise.all(eraIndex.map(async (i) => api.query.staking.erasRewardPoints(i)));
    // Logger.debug('erasRewardPointsArr');
    // Logger.debug(erasRewardPointsArr);
    const pointsHistory = eraIndex.map((i, index) => {
      return { eraIndex: i, erasRewardPoints: erasRewardPointsArr[index].toJSON() };
    });
    Logger.info('waiting 5s');
    await wait(5000);

    const slashes = await module.exports.getSlashes(api, pointsHistory);

    const valPrefs = {};
    const valExposure = {};
    const rewards: Array<IValidatorHistory> = [];

    for (let i = 0; i < pointsHistory.length; i++) {
      Logger.info('waiting 5 secs');
      await wait(5000);
      valExposure[pointsHistory[i].eraIndex] = await Promise.all(
        Object.keys(pointsHistory[i].erasRewardPoints.individual).map((x) =>
          api.query.staking.erasStakers(pointsHistory[i].eraIndex, x.toString()),
        ),
      );
      valPrefs[pointsHistory[i].eraIndex] = await Promise.all(
        Object.keys(pointsHistory[i].erasRewardPoints.individual).map((x) =>
          api.query.staking.erasValidatorPrefs(pointsHistory[i].eraIndex, x.toString()),
        ),
      );

      Object.keys(pointsHistory[i].erasRewardPoints.individual).forEach((y, index) => {
        //
        // poolReward = eraPoints/totalErapoints * totalReward
        // validatorReward = (eraPoints/totalErapoints * totalReward) * ownStake/totalStake + commission
        //

        // // poolreward calculation
        // const poolReward =
        //   (pointsHistory[i].erasRewardPoints.individual[y] /
        //     pointsHistory[i].erasRewardPoints.total) *
        //   pointsHistory[i].totalReward;
        // // console.log(poolReward)

        // // validator reward calculation
        // const validatorReward =
        //   ((pointsHistory[i].erasRewardPoints.individual[y] /
        //     pointsHistory[i].erasRewardPoints.total) *
        //     pointsHistory[i].totalReward *
        //     parseInt(valExposure[pointsHistory[i].eraIndex][index].own)) /
        //     parseInt(valExposure[pointsHistory[i].eraIndex][index].total) +
        //   parseInt(valPrefs[pointsHistory[i].eraIndex][index].commission);
        // // console.log(validatorReward)

        // nominator info calculation
        const nominatorsInfo = valExposure[pointsHistory[i].eraIndex][index].others.map((x) => {
          const nomId = x.who.toString();
          // const nomReward =
          //   (((pointsHistory[i].erasRewardPoints.individual[y] /
          //     pointsHistory[i].erasRewardPoints.total) *
          //     pointsHistory[i].totalReward -
          //     parseInt(valPrefs[pointsHistory[i].eraIndex][index].commission)) *
          //     parseInt(x.value)) /
          //   parseInt(valExposure[pointsHistory[i].eraIndex][index].total);
          return {
            nomId: nomId,
            // nomReward: nomReward,
            nomStake: parseInt(x.value),
          };
        });
        const slashInfo = slashes[y].filter((x) => parseInt(x.era) == pointsHistory[i].eraIndex);
        rewards.push({
          stashId: y,
          commission: parseInt(valPrefs[pointsHistory[i].eraIndex][index].commission),
          eraIndex: pointsHistory[i].eraIndex,
          eraPoints: pointsHistory[i].erasRewardPoints.individual[y],
          totalEraPoints: pointsHistory[i].erasRewardPoints.total,
          totalStake: parseInt(valExposure[pointsHistory[i].eraIndex][index].total),
          nominatorsInfo: nominatorsInfo,
          slashCount: slashInfo[0] !== undefined ? parseInt(slashInfo[0].total) : 0,
        });
      });
    }

    // insert data into DB
    const ValidatorHistory = Container.get('ValidatorHistory') as mongoose.Model<IValidatorHistory & mongoose.Document>;
    try {
      await ValidatorHistory.insertMany(rewards);
    } catch (error) {
      Logger.error('Error while updating validator history data', error);
    }
    return;
  },
};

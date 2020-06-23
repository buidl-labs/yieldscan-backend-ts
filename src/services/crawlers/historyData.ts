import { Container } from 'typedi';

import ValidatorHistory from '../../models/validatorHistory';
import { wait } from '../utils';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start historyData');
    Logger.debug('Hello There');
    const eraIndex = await module.exports.getEraIndexes(api);
    Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      await module.exports.storeValidatorHistory(api, eraIndex);
    }
    Logger.info('stop historyData');
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
    const Logger = Container.get('logger');
    const lastIndexDB = await ValidatorHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    Logger.debug(lastIndexDB);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = currentEra - historyDepth;
    Logger.debug('lastAvailableEra', lastAvailableEra);

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
    const erasRewardPointsArr = await Promise.all(eraIndex.map((i) => api.query.staking.erasRewardPoints(i)));

    const pointsHistory = eraIndex.map((i, index) => {
      return { eraIndex: i, erasRewardPoints: erasRewardPointsArr[index] };
    });
    Logger.info('waiting 15s');
    await wait(15000);

    const pointsHistoryWithTotalReward = JSON.parse(JSON.stringify(pointsHistory));

    const slashes = await module.exports.getSlashes(api, pointsHistoryWithTotalReward);

    const valPrefs = {};
    const valExposure = {};
    const rewards = [];

    for (let i = 0; i < pointsHistoryWithTotalReward.length; i++) {
      Logger.info('waiting 5 secs');
      await wait(5000);
      valExposure[pointsHistoryWithTotalReward[i].eraIndex] = await Promise.all(
        Object.keys(pointsHistoryWithTotalReward[i].erasRewardPoints.individual).map((x) =>
          api.query.staking.erasStakers(pointsHistoryWithTotalReward[i].eraIndex, x.toString()),
        ),
      );
      valPrefs[pointsHistoryWithTotalReward[i].eraIndex] = await Promise.all(
        Object.keys(pointsHistoryWithTotalReward[i].erasRewardPoints.individual).map((x) =>
          api.query.staking.erasValidatorPrefs(pointsHistoryWithTotalReward[i].eraIndex, x.toString()),
        ),
      );

      Object.keys(pointsHistoryWithTotalReward[i].erasRewardPoints.individual).forEach((y, index) => {
        //
        // poolReward = eraPoints/totalErapoints * totalReward
        // validatorReward = (eraPoints/totalErapoints * totalReward) * ownStake/totalStake + commission
        //

        // // poolreward calculation
        // const poolReward =
        //   (pointsHistoryWithTotalReward[i].erasRewardPoints.individual[y] /
        //     pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
        //   pointsHistoryWithTotalReward[i].totalReward;
        // // console.log(poolReward)

        // // validator reward calculation
        // const validatorReward =
        //   ((pointsHistoryWithTotalReward[i].erasRewardPoints.individual[y] /
        //     pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
        //     pointsHistoryWithTotalReward[i].totalReward *
        //     parseInt(valExposure[pointsHistoryWithTotalReward[i].eraIndex][index].own)) /
        //     parseInt(valExposure[pointsHistoryWithTotalReward[i].eraIndex][index].total) +
        //   parseInt(valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index].commission);
        // // console.log(validatorReward)

        // nominator info calculation
        const nominatorsInfo = valExposure[pointsHistoryWithTotalReward[i].eraIndex][index].others.map((x) => {
          const nomId = x.who.toString();
          // const nomReward =
          //   (((pointsHistoryWithTotalReward[i].erasRewardPoints.individual[y] /
          //     pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
          //     pointsHistoryWithTotalReward[i].totalReward -
          //     parseInt(valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index].commission)) *
          //     parseInt(x.value)) /
          //   parseInt(valExposure[pointsHistoryWithTotalReward[i].eraIndex][index].total);
          return {
            nomId: nomId,
            // nomReward: nomReward,
            nomStake: parseInt(x.value),
          };
        });
        const slashInfo = slashes[y].filter((x) => parseInt(x.era) == pointsHistoryWithTotalReward[i].eraIndex);
        rewards.push({
          stashId: y,
          commission: parseInt(valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index].commission),
          eraIndex: pointsHistoryWithTotalReward[i].eraIndex,
          eraPoints: pointsHistoryWithTotalReward[i].erasRewardPoints.individual[y],
          totalEraPoints: pointsHistoryWithTotalReward[i].erasRewardPoints.total,
          nominatorsInfo: nominatorsInfo,
          slashCount: slashInfo[0] !== undefined ? parseInt(slashInfo[0].total) : 0,
        });
      });
    }

    // insert data into DB
    await ValidatorHistory.insertMany(rewards);
  },
};

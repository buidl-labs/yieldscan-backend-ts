import { Container } from 'typedi';
import mongoose from 'mongoose';

import { INominatorHistory } from '../../interfaces/INominatorHistory';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

module.exports = {
  start: async function (api, networkName) {
    const Logger = Container.get('logger');
    Logger.info('start nominatorHistoryData');
    const NominatorHistory = Container.get(networkName + 'NominatorHistory') as mongoose.Model<
      INominatorHistory & mongoose.Document
    >;
    const eraIndex = await module.exports.getEraIndexes(api, NominatorHistory);
    // Logger.debug(eraIndex);
    if (eraIndex.length !== 0) {
      await module.exports.storeNominatorHistory(api, eraIndex, networkName, NominatorHistory);
    }
    Logger.info('stop historyData');
    return;
  },

  getEraIndexes: async function (api, NominatorHistory) {
    // const Logger = Container.get('logger');
    const lastIndexDB = await NominatorHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    // Logger.debug(lastIndexDB);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = currentEra - historyDepth;
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

  storeNominatorHistory: async function (api, eraIndex, networkName, NominatorHistory) {
    const Logger = Container.get('logger');
    const ValidatorHistory = Container.get(networkName + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;
    const data = await ValidatorHistory.find({ eraIndex: { $in: eraIndex } }).lean();
    const historyData = [];
    data.map((x) => {
      x.nominatorsInfo.forEach((y) => {
        if (historyData.some((element) => element.nomId == y.nomId && element.eraIndex == x.eraIndex)) {
          historyData.map((z) => {
            if (z.nomId == y.nomId && z.eraIndex == x.eraIndex) {
              z.validatorsInfo.push({
                stashId: x.stashId,
                nomStake: y.nomStake,
                commission: x.commission,
                eraPoints: x.eraPoints,
                totalEraPoints: x.totalEraPoints,
                totalStake: x.totalStake,
              });
            }
          });
        } else {
          historyData.push({
            nomId: y.nomId,
            eraIndex: x.eraIndex,
            validatorsInfo: [
              {
                stashId: x.stashId,
                nomStake: y.nomStake,
                commission: x.commission,
                eraPoints: x.eraPoints,
                totalEraPoints: x.totalEraPoints,
                totalStake: x.totalStake,
              },
            ],
          });
        }
      });
    });
    try {
      await NominatorHistory.insertMany(historyData);
    } catch (err) {
      Logger.error('Error while updating nominators history', err);
    }
    return;
  },
};

import mongoose from 'mongoose';
import { Container } from 'typedi';

import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import { INominatorHistory } from '../../interfaces/INominatorHistory';
import { IActiveNominators } from '../../interfaces/IActiveNominators';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start activeNominators');
    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const sessionValidators = await SessionValidators.find({});

    const nominatorsInfo = await module.exports.getNominatorsInfo(sessionValidators);

    await module.exports.getDailyEarnings(nominatorsInfo);

    Logger.info('stop activeNominators');
  },

  getNominatorsInfo: async function (sessionValidators) {
    const result = [];
    sessionValidators.map((x) => {
      x.nominators.forEach((y) => {
        if (result.some((element) => element.nomId == y.nomId)) {
          result.map((z) => {
            if (z.nomId == y.nomId) {
              z.validatorsInfo.push({
                stashId: x.stashId,
                commission: x.commission,
                totalStake: x.totalStake,
                nomStake: y.stake,
              });
            }
          });
        } else {
          result.push({
            nomId: y.nomId,
            validatorsInfo: [
              {
                stashId: x.stashId,
                commission: x.commission,
                totalStake: x.totalStake,
                nomStake: y.nomStake,
              },
            ],
          });
        }
      });
    });
    return result;
  },
  getDailyEarnings: async function (nominatorsInfo) {
    const TotalRewardHistory = Container.get('TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(4);
    const NominatorHistory = Container.get('NominatorHistory') as mongoose.Model<INominatorHistory & mongoose.Document>;
    const eraIndexArr = lastIndexDB.map((x) => x.eraIndex);
    const previous4ErasData = await NominatorHistory.find({ eraIndex: { $in: eraIndexArr } });
    nominatorsInfo.map((x) => {
      const individualHistory = previous4ErasData.filter((y) => y.nomId == x.nomId);
      const earnings = individualHistory.map((y) => {
        const totalReward = lastIndexDB.filter((z) => z.eraIndex == y.eraIndex);
        // console.log(totalReward[0].eraTotalReward);
        const result = y.validatorsInfo.reduce((a, b) => {
          const commission = b.commission / Math.pow(10, 9);
          const totalStake = b.totalStake / Math.pow(10, 12);
          const nomStake = b.nomStake / Math.pow(10, 12);
          const poolReward = ((totalReward[0].eraTotalReward / Math.pow(10, 12)) * b.eraPoints) / b.totalEraPoints;
          const reward = (poolReward - commission * poolReward) * (nomStake / totalStake);
          return a + reward;
        }, 0);
        return result;
      });
      x.dailyEarnings = earnings.reduce((a, b) => a + b, 0);
    });
    const ActiveNominators = Container.get('ActiveNominators') as mongoose.Model<IActiveNominators & mongoose.Document>;
    await ActiveNominators.deleteMany({});
    await ActiveNominators.insertMany(nominatorsInfo);

    // const lastIndex = lastIndexDB[0].eraIndex;
  },
};

import mongoose from 'mongoose';
import { Container } from 'typedi';

import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { wait, scaleData, normalizeData } from '../utils';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start sessionValidators');
    const sessionValidators = await api.query.session.validators();
    // Logger.debug(sessionValidators);
    const stakingInfo = await module.exports.getStakingInfo(api, sessionValidators);
    // Logger.debug(stakingInfo);
    const stakingInfoWithRewards = await module.exports.getEstimatedPoolReward(api, sessionValidators, stakingInfo);
    await module.exports.getRiskScore(stakingInfoWithRewards);

    // save next elected information
    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    try {
      await SessionValidators.deleteMany({});
      await SessionValidators.insertMany(stakingInfoWithRewards);
    } catch (error) {
      Logger.error(error);
    }
    Logger.info('stop sessionValidators');
  },

  getStakingInfo: async function (api, sessionValidators): Promise<Array<IStakingInfo>> {
    await wait(5000);
    const stakingInfo = await Promise.all(sessionValidators.map((valId) => api.derive.staking.account(valId)));
    return stakingInfo.map((x) => {
      const stashId = x.stashId.toString();
      const accountId = x.accountId.toString();
      const controllerId = x.controllerId.toString();
      const commission = parseInt(x.validatorPrefs.commission);
      const totalStake = parseInt(x.exposure.total);
      const ownStake = parseInt(x.exposure.own);
      const nominators = x.exposure.others.map((y) => {
        const nomId = y.who.toString();
        const stake = parseInt(y.value);
        return {
          nomId: nomId,
          stake: stake,
        };
      });
      return {
        stashId: stashId,
        controllerId: controllerId,
        accountId: accountId,
        commission: commission,
        totalStake: totalStake,
        ownStake: ownStake,
        nominators: nominators,
      };
    });
  },

  getEstimatedPoolReward: async function (api, sessionValidators, stakingInfo: Array<IStakingInfo>) {
    await wait(5000);
    const Logger = Container.get('logger');
    const sessionValidatorsArr = sessionValidators.map((x) => x.toString());
    const TotalRewardHistory = Container.get('TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    const lastIndexDBTotalReward = lastIndexDB[0].eraTotalReward;
    const ValidatorHistory = Container.get('ValidatorHistory') as mongoose.Model<IValidatorHistory & mongoose.Document>;
    const historyData = await ValidatorHistory.aggregate([
      {
        $match: { stashId: { $in: sessionValidatorsArr } },
      },
      {
        $group: {
          _id: '$stashId',
          totalSlashCount: {
            $sum: '$slashCount',
          },
          eraPointsArr: { $push: '$eraPoints' },
          erPointsFractionArr: { $push: { $divide: ['$eraPoints', '$totalEraPoints'] } },
        },
      },
    ]);

    // calculation start Estimated Pool Reward
    // get avg era points fraction
    historyData.map((x) => {
      x.avgEraPointsFraction =
        x.erPointsFractionArr.length !== 0
          ? x.erPointsFractionArr.reduce((a, b) => a + b, 0) / x.erPointsFractionArr.length
          : 0;
      x.activeErasCount = x.erPointsFractionArr.length;
      x.estimatedPoolReward = x.avgEraPointsFraction * lastIndexDBTotalReward;
    });

    // map these values to
    stakingInfo.map((x) => {
      const requiredData = historyData.filter((y) => y._id == x.stashId);
      if (requiredData.length == 0) {
        x.estimatedPoolReward = historyData.reduce((a, b) => a + b.avgEraPointsFraction, 0) / historyData.length;
        x.activeErasCount = 0;
        x.totalSlashCount = 0;
        const poolReward = x.estimatedPoolReward / Math.pow(10, 12);
        const totalStake = x.totalStake / Math.pow(10, 12);
        const commission = x.commission / Math.pow(10, 9);
        x.rewardsPer100KSM =
          // eslint-disable-next-line prettier/prettier
          (poolReward - (commission * poolReward)) * 100 / (100 + totalStake);
      } else {
        x.estimatedPoolReward = requiredData[0].estimatedPoolReward;
        x.activeErasCount = requiredData[0].activeErasCount;
        x.totalSlashCount = requiredData[0].totalSlashCount;
        const poolReward = x.estimatedPoolReward / Math.pow(10, 12);
        const totalStake = x.totalStake / Math.pow(10, 12);
        const commission = x.commission / Math.pow(10, 9);
        x.rewardsPer100KSM =
          // eslint-disable-next-line prettier/prettier
          (poolReward - (commission * poolReward)) * 100 / (100 + totalStake);
      }
    });
    // Logger.debug(stakingInfo);
    return stakingInfo;
  },

  getRiskScore: async function (stakingInfo: Array<IStakingInfo>) {
    const Logger = Container.get('logger');
    Logger.info('waiting 5 secs');
    await wait(5000);
    const maxNomCount = Math.max(...stakingInfo.map((x) => x.nominators.length));
    const minNomCount = Math.min(...stakingInfo.map((x) => x.nominators.length));
    const maxOwnStake = Math.max(...stakingInfo.map((x) => x.ownStake));
    const minOwnStake = Math.min(...stakingInfo.map((x) => x.ownStake));
    const maxOthersStake = Math.max(...stakingInfo.map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)));
    const minOthersStake = Math.min(...stakingInfo.map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)));
    const riskScoreArr = [];
    stakingInfo.forEach((element) => {
      const otherStake = element.nominators.reduce((a, b) => a + b.stake, 0);
      const slashScore = element.totalSlashCount;
      const activevalidatingScore = 1 / (element.activeErasCount + 1);
      const backersScore = 1 / scaleData(element.nominators.length, maxNomCount, minNomCount);
      const validatorOwnRisk = 1 / scaleData(element.ownStake, maxOwnStake, minOwnStake);
      // + 1 because othersStake can theoretically be 0
      const otherStakeScore = 1 / scaleData(otherStake + 1, maxOthersStake, minOthersStake);
      const riskScore = slashScore + activevalidatingScore + backersScore + otherStakeScore + validatorOwnRisk;

      riskScoreArr.push({
        riskScore: riskScore,
        stashId: element.stashId,
      });
    });
    const maxRS = Math.max(...riskScoreArr.map((x) => x.riskScore));
    const minRS = Math.min(...riskScoreArr.map((x) => x.riskScore));
    stakingInfo.map((x) => {
      const riskData = riskScoreArr.filter((y) => y.stashId == x.stashId);
      x.riskScore = normalizeData(riskData[0].riskScore, maxRS, minRS);
    });
  },
};

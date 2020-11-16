import mongoose from 'mongoose';
import { Container } from 'typedi';

import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { wait, scaleData, normalizeData, chunkArray } from '../utils';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

module.exports = {
  start: async function (api, networkName) {
    const Logger = Container.get('logger');
    Logger.info('start validators');

    const maxNominatorRewardedPerValidator = await api.consts.staking.maxNominatorRewardedPerValidator.toNumber();

    const allStashes = (await api.derive.staking.stashes()).map((x) => x.toString());
    await wait(5000);
    const sessionAndNextElectedValidators = await api.derive.staking.validators();
    await wait(5000);
    const waitingValidators = (await api.derive.staking.waitingInfo()).waiting.map((x) => x.toString());
    await wait(5000);
    const sessionValidators = sessionAndNextElectedValidators.validators.map((x) => x.toString());

    // we need to do the following because all stashes was missing one of the validators on crosschecking
    sessionValidators.map((x) => {
      if (!allStashes.includes(x)) {
        allStashes.push(x);
      }
    });

    const nextElected = sessionAndNextElectedValidators.nextElected.map((x) => x.toString());

    const nominations = (await api.query.staking.nominators.entries()).map((x) => {
      return {
        nomId: x[0].args[0].toString(),
        targets: x[1].unwrap().targets.map((y) => y.toString()),
      };
    });

    // Logger.debug(sessionValidators);
    let stakingInfo = await module.exports.getStakingInfo(
      api,
      sessionValidators,
      nextElected,
      waitingValidators,
      nominations,
      allStashes,
      maxNominatorRewardedPerValidator,
    );
    // Logger.debug(stakingInfo);
    stakingInfo = await module.exports.getEstimatedPoolReward(api, allStashes, stakingInfo, networkName);
    stakingInfo = await module.exports.getRiskScore(stakingInfo);

    // save next elected information
    const Validators = Container.get(networkName + 'Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    try {
      await Validators.deleteMany({});
      await Validators.insertMany(stakingInfo);
    } catch (error) {
      Logger.error('Error while updating validators info', error);
    }
    Logger.info('stop validators');
    return;
  },

  getStakingInfo: async function (
    api,
    sessionValidators,
    nextElected,
    waitingValidators,
    nominations,
    allStashes,
    maxNominatorRewardedPerValidator,
  ) {
    await wait(5000);

    const chunkedStashes = chunkArray(allStashes, 100);
    const stakingInfo = [];

    for (let i = 0; i < chunkedStashes.length; i++) {
      const info = await Promise.all(chunkedStashes[i].map((valId) => api.derive.staking.account(valId)));
      stakingInfo.push(...info);
      await wait(5000);
    }

    return stakingInfo.map((x) => {
      const stashId = x.stashId.toString();
      const accountId = x.accountId.toString();
      const controllerId = x.controllerId !== null ? x.controllerId.toString() : null;
      const commission = parseInt(x.validatorPrefs.commission);
      const totalStake =
        parseInt(x.exposure.total) !== 0 ? parseInt(x.exposure.total) : parseInt(x.stakingLedger.total);
      const ownStake = parseInt(x.exposure.total) !== 0 ? parseInt(x.exposure.own) : parseInt(x.stakingLedger.total);
      const claimedRewards = x.stakingLedger.claimedRewards.map((era) => parseInt(era));
      const nominators = sessionValidators.includes(stashId)
        ? x.exposure.others.map((y) => {
            const nomId = y.who.toString();
            const stake = parseInt(y.value);
            return {
              nomId: nomId,
              stake: stake,
            };
          })
        : nominations
            .filter((y) => y.targets.includes(stashId))
            .map((z) => {
              return { nomId: z.nomId };
            });
      return {
        stashId: stashId,
        controllerId: controllerId,
        accountId: accountId,
        commission: commission,
        totalStake: totalStake,
        isElected: sessionValidators.includes(stashId),
        isNextElected: nextElected.includes(stashId),
        isWaiting: waitingValidators.includes(stashId),
        ownStake: ownStake,
        nominators: nominators,
        oversubscribed: nominators.length >= maxNominatorRewardedPerValidator ? true : false,
        claimedRewards: claimedRewards,
      };
    });
  },

  getEstimatedPoolReward: async function (api, allStashes, stakingInfo: Array<IStakingInfo>, networkName) {
    await wait(5000);
    // const Logger = Container.get('logger');
    const TotalRewardHistory = Container.get(networkName + 'TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    const lastIndexDBTotalReward = lastIndexDB[0].eraTotalReward;
    const ValidatorHistory = Container.get(networkName + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;
    const historyData = await ValidatorHistory.aggregate([
      {
        $match: { stashId: { $in: allStashes } },
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
    const decimalPlaces = networkName == 'kusama' ? 12 : 10;
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
        const poolReward = x.estimatedPoolReward / Math.pow(10, decimalPlaces);
        const totalStake = x.totalStake / Math.pow(10, decimalPlaces);
        const commission = x.commission / Math.pow(10, 9);
        x.rewardsPer100KSM =
          // eslint-disable-next-line prettier/prettier
          ((poolReward - commission * poolReward) * 100) / (100 + totalStake);
      } else {
        x.estimatedPoolReward = requiredData[0].estimatedPoolReward;
        x.activeErasCount = requiredData[0].activeErasCount;
        x.totalSlashCount = requiredData[0].totalSlashCount;
        const poolReward = x.estimatedPoolReward / Math.pow(10, decimalPlaces);
        const totalStake = x.totalStake / Math.pow(10, decimalPlaces);
        const commission = x.commission / Math.pow(10, 9);
        x.rewardsPer100KSM =
          // eslint-disable-next-line prettier/prettier
          ((poolReward - commission * poolReward) * 100) / (100 + totalStake);
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
    const maxTotalStake = Math.max(...stakingInfo.map((x) => x.totalStake));
    const minTotalStake = Math.min(...stakingInfo.map((x) => x.totalStake));
    const maxOwnStake = Math.max(...stakingInfo.filter((x) => x.isElected).map((x) => x.ownStake));
    const minOwnStake = Math.min(...stakingInfo.filter((x) => x.isElected).map((x) => x.ownStake));
    const maxOthersStake = Math.max(
      ...stakingInfo.filter((x) => x.isElected).map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)),
    );
    const minOthersStake = Math.min(
      ...stakingInfo.filter((x) => x.isElected).map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)),
    );
    const riskScoreArr = [];
    stakingInfo.forEach((element) => {
      const otherStake = element.isElected ? element.nominators.reduce((a, b) => a + b.stake, 0) : null;
      // Todo: better formulae for handling high slash counts
      const slashScore = Math.min(element.totalSlashCount, 2);
      const activevalidatingScore = 1 / (element.activeErasCount + 1);
      const backersScore = 1 / scaleData(element.nominators.length, maxNomCount, minNomCount);
      const validatorOwnRisk = element.isElected ? 3 / scaleData(element.ownStake, maxOwnStake, minOwnStake) : 1;
      const totalStakeScore = 1 / scaleData(element.totalStake, maxTotalStake, minTotalStake);
      // + 1 because othersStake can theoretically be 0
      const otherStakeScore = element.isElected ? 1 / scaleData(otherStake + 1, maxOthersStake, minOthersStake) : 0;
      const riskScore =
        slashScore + activevalidatingScore + backersScore + otherStakeScore + validatorOwnRisk + totalStakeScore;

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
    return stakingInfo;
  },
};

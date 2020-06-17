import ValidatorHistory from '../../models/validatorHistory';
import NextElected from '../../models/NextElected';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { wait, scaleData, normalizeData } from '../utils';

module.exports = {
  start: async function (api) {
    console.log('start nextElected');
    const nextElected = await api.derive.staking.nextElected();
    // console.log(JSON.stringify(nextElected));
    const stakingInfo = await module.exports.getStakingInfo(api, nextElected);
    // console.log(stakingInfo);
    await module.exports.getEstimatedPoolReward(api, nextElected, stakingInfo);
    await module.exports.getRiskScore(stakingInfo);
    console.log(stakingInfo);
    console.log('stop nextElected');

    // save next elected information
    try {
      await NextElected.insertMany(stakingInfo);
    } catch (error) {
      console.log(error);
    }
  },

  getStakingInfo: async function (api, nextElected): Promise<Array<IStakingInfo>> {
    await wait(5000);
    const stakingInfo = await Promise.all(nextElected.map((valId) => api.derive.staking.account(valId)));
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

  getEstimatedPoolReward: async function (api, nextElected, stakingInfo: Array<IStakingInfo>) {
    await wait(5000);
    const count = 15;
    console.log(count);
    const nextElectedArr = nextElected.map((x) => x.toString());
    console.log(nextElectedArr);
    const lastIndexDB = await ValidatorHistory.find({}).sort({ eraIndex: -1 }).limit(1);
    const lastIndexDBTotalReward = lastIndexDB[0].totalReward;
    // keep last EraIndex from Db in memory
    console.log(lastIndexDBTotalReward);
    // const arr = [...Array(count).keys()].map((i) => lastEraIndexDB - i);
    // const historyData = await ValidatorHistory.find({ eraIndex: { $in: arr } })
    //   .select(['eraPoints', 'totalEraPoints', 'stashId', 'totalReward', 'slashCount'])
    //   .lean();
    // console.log(historyData);
    // await ValidatorHistory.deleteMany({ eraIndex: 923 });

    const historyData = await ValidatorHistory.aggregate([
      {
        $match: { stashId: { $in: nextElectedArr } },
      },
      {
        $group: {
          _id: '$stashId' ,
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

    // console.log(historyData);
    // map these values to
    stakingInfo.map((x) => {
      const requiredData = historyData.filter((y) => y._id == x.stashId);
      if (requiredData.length == 0) {
        x.estimatedPoolReward = historyData.reduce((a, b) => a + b.avgEraPointsFraction, 0) / historyData.length;
        x.activeErasCount = 0;
        x.totalSlashCount = 0;
      } else {
        x.estimatedPoolReward = requiredData[0].estimatedPoolReward;
        x.activeErasCount = requiredData[0].activeErasCount;
        x.totalSlashCount = requiredData[0].totalSlashCount;
      }
    });
  },

  getRiskScore: async function (stakingInfo: Array<IStakingInfo>) {
    console.log('waiting 5 secs');
    await wait(5000);
    const maxNomCount = Math.max(...stakingInfo.map((x) => x.nominators.length));
    const minNomCount = Math.min(...stakingInfo.map((x) => x.nominators.length));
    const maxOwnStake = Math.max(...stakingInfo.map((x) => x.ownStake));
    const minOwnStake = Math.min(...stakingInfo.map((x) => x.ownStake));
    const maxOthersStake = Math.max(...stakingInfo.map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)));
    const minOthersStake = Math.min(...stakingInfo.map((x) => x.nominators.reduce((a, b) => a + b.stake, 0)));
    console.log(maxNomCount, minNomCount, maxOwnStake, minOwnStake);
    const riskScoreArr = [];
    stakingInfo.forEach((element) => {
      const otherStake = element.nominators.reduce((a, b) => a + b.stake, 0);
      // console.log(otherStake)
      // console.log(element.activeEras)
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
      // console.log('stashId: ' + element.stashId.toString() + ' slashScore: ' + slashScore.toFixed(3) + ' backersScore: ' + backersScore.toFixed(3) + ' ownStake: ' + validatorOwnRisk +' otherStake: '+  (1 / scaleData(otherStake, maxOthS, minOthS)).toFixed(3) + ' riskScore: ' + riskScore.toFixed(3) )
    });
    console.log(riskScoreArr);
    const maxRS = Math.max(...riskScoreArr.map((x) => x.riskScore));
    const minRS = Math.min(...riskScoreArr.map((x) => x.riskScore));
    stakingInfo.map((x) => {
      const riskData = riskScoreArr.filter((y) => y.stashId == x.stashId);
      x.riskScore = normalizeData(riskData[0].riskScore, maxRS, minRS);
    });
  },
};

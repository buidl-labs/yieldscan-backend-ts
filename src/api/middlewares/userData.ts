import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IActiveNominators } from '../../interfaces/IActiveNominators';
import { HttpError } from '../../services/utils';

const userData = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const id = req.params.id;
    const ActiveNominators = Container.get(networkName + 'ActiveNominators') as mongoose.Model<
      IActiveNominators & mongoose.Document
    >;

    const data = await ActiveNominators.aggregate([
      {
        $match: {
          nomId: id,
        },
      },
      {
        $lookup: {
          from: networkName + 'accountidentities',
          localField: 'validatorsInfo.stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
      {
        $lookup: {
          from: networkName + 'accountidentities',
          localField: 'nomId',
          foreignField: 'accountId',
          as: 'nomInfo',
        },
      },
    ]);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No user data found');
    }

    const nomName = data[0].nomInfo[0] !== undefined ? data[0].nomInfo[0].display : null;
    const totalRewards =
      data[0].validatorsInfo.reduce((a, b) => a + b.estimatedReward, 0) /
      (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
    const totalAmountStaked =
      data[0].validatorsInfo.filter((x) => x.isElected).reduce((a, b) => a + b.nomStake, 0) /
      (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
    const validatorsInfo = data[0].validatorsInfo.map((x) => {
      const name = data[0].info.filter((valId) => valId.stashId == x.stashId);
      return {
        stashId: x.stashId,
        riskScore: x.riskScore,
        isElected: x.isElected,
        isWaiting: x.isWaiting,
        totalStake: x.totalStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10)),
        estimatedPoolReward: x.estimatedPoolReward / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10)),
        estimatedReward: x.isElected
          ? x.estimatedReward / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10))
          : null,
        commission: x.commission / Math.pow(10, 7),
        nomStake: x.nomStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10)),
        claimedRewardEras: x.claimedRewards,
        name: name[0] !== undefined ? name[0].display : null,
      };
    });

    const result = {
      nomId: data[0].nomId,
      name: nomName,
      stats: {
        totalAmountStaked: totalAmountStaked,
        estimatedRewards: totalRewards,
        earnings: data[0].dailyEarnings,
      },
      validatorsInfo: validatorsInfo,
    };

    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating user data: %o', e);
    return next(e);
  }
};

export default userData;

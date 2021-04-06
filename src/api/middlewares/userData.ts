import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IActiveNominators } from '../../interfaces/IActiveNominators';
import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';

const userData = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const id = req.params.id;
    const ActiveNominators = Container.get(networkDetails.name + 'ActiveNominators') as mongoose.Model<
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
          from: networkDetails.name + 'accountidentities',
          localField: 'validatorsInfo.stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
      {
        $lookup: {
          from: networkDetails.name + 'accountidentities',
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
      data[0].validatorsInfo.reduce((a, b) => a + b.estimatedReward, 0) / Math.pow(10, networkDetails.decimalPlaces);
    const totalAmountStaked =
      data[0].validatorsInfo.filter((x) => x.isElected).reduce((a, b) => a + b.nomStake, 0) /
      Math.pow(10, networkDetails.decimalPlaces);
    const validatorsInfo = data[0].validatorsInfo.map((x) => {
      const name = data[0].info.filter((valId) => valId.stashId == x.stashId);
      return {
        stashId: x.stashId,
        riskScore: x.riskScore,
        isElected: x.isElected,
        isWaiting: x.isWaiting,
        totalStake: x.totalStake / Math.pow(10, networkDetails.decimalPlaces),
        estimatedPoolReward: x.estimatedPoolReward / Math.pow(10, networkDetails.decimalPlaces),
        estimatedReward: x.isElected ? x.estimatedReward / Math.pow(10, networkDetails.decimalPlaces) : null,
        commission: x.commission / Math.pow(10, 7),
        nomStake: x.nomStake / Math.pow(10, networkDetails.decimalPlaces),
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

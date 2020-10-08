import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { HttpError } from '../../services/utils';

const validatorsInfo = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const stashIds = req.query.stashIds.split(',');
    const Validators = Container.get(networkName + 'Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const data = await Validators.aggregate([
      {
        $match: {
          stashId: { $in: stashIds },
        },
      },
      {
        $lookup: {
          from: networkName + 'accountidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
    ]);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    if (data.length > 16) {
      Logger.error('🔥 Max number of ids allowed to query at once is only 16: %o');
      throw new HttpError(400, 'Max number of ids allowed to query at once is only 16');
    }

    data.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
      x.ownStake = x.ownStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
      x.othersStake = x.totalStake - x.ownStake;
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
      x.name = x.info[0] !== undefined ? x.info[0].display : null;
    });

    const result = data.map(
      ({
        stashId,
        commission,
        ownStake,
        othersStake,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
        isElected,
        isWaiting,
        isNextElected,
      }) => ({
        stashId,
        commission,
        ownStake,
        othersStake,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
        isElected,
        isWaiting,
        isNextElected,
      }),
    );

    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching validators data: %o', e);
    return next(e);
  }
};

export default validatorsInfo;

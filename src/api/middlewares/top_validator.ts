import { Container } from 'typedi';
import mongoose from 'mongoose';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
// import { sortLowRisk, sortMedRisk } from '../../services/utils'
import { HttpError } from '../../services/utils';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

const top_validator = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const TotalRewardHistory = Container.get('TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);

    const eraIndex = lastIndexDB[0].eraIndex;
    const eraTotalReward = lastIndexDB[0].eraTotalReward;

    const ValidatorHistory = Container.get('ValidatorHistory') as mongoose.Model<IValidatorHistory & mongoose.Document>;
    const sortedData = await ValidatorHistory.aggregate([
      {
        $match: {
          eraIndex: eraIndex,
        },
      },
      {
        $sort: {
          eraPoints: -1,
        },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'accountidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
    ]);

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 9);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.estimatedPoolReward = ((x.eraPoints / x.totalEraPoints) * eraTotalReward) / Math.pow(10, 12);
    });
    const result = sortedData.map(({ stashId, commission, totalStake, estimatedPoolReward, info }) => ({
      stashId,
      commission,
      totalStake,
      estimatedPoolReward,
      info,
    }));
    return res.status(200).json(result);
  } catch (e) {
    Logger.error('🔥 Error fetching max-set: %o', e);
    return next(e);
  }
};

export default top_validator;

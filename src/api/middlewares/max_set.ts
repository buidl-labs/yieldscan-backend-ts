import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
// import { sortLowRisk, sortMedRisk } from '../../services/utils'
import { HttpError } from '../../services/utils';

const max_set = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const Validators = Container.get('Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const sortedData = await Validators.find({ isNextElected: true }).sort({
      rewardsPer100KSM: -1,
    });

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 9);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
    });
    // console.log(sortedData);
    const result = sortedData.slice(0, 16).map(({ stashId, commission, totalStake, estimatedPoolReward }) => ({
      stashId,
      commission,
      totalStake,
      estimatedPoolReward,
    }));
    // console.log(result)
    return res.status(200).json(result);
  } catch (e) {
    Logger.error('🔥 Error fetching max-set: %o', e);
    return next(e);
  }
};

export default max_set;

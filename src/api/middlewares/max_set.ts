import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
// import { sortLowRisk, sortMedRisk } from '../../services/utils'
import { NoDataFound } from '../../services/utils';

const max_set = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const NextElected = Container.get('NextElected') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const sortedData = await NextElected.find({}).sort({
      rewardsPer100KSM: -1,
    });
    // console.log(sortedData);
    // const lowRiskSortArr = sortLowRisk(sortedData);
    // const medRiskSortArr = sortMedRisk(sortedData);
    if (sortedData.length == 0) {
      throw new NoDataFound('No data found', 404);
    }

    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 9);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
    });
    if (!(sortedData.length > 0)) {
      res.json([]);
      return;
    }
    // console.log(sortedData);
    const result = sortedData.slice(0, 16).map(({ stashId, commission, totalStake, estimatedPoolReward }) => ({
      stashId,
      commission,
      totalStake,
      estimatedPoolReward,
    }));
    // console.log(result)
    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching max-set: %o', e);
    return next(e);
  }
};

export default max_set;

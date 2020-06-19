import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { sortLowRisk, sortMedRisk } from '../../services/utils';

const risk_set = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const NextElected = Container.get('NextElected') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const sortedData = await NextElected.find({}).sort({
      rewardsPer100KSM: -1,
    });
    // console.log(sortedData);
    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
    });
    // console.log('sortedData', sortedData);
    const arr1 = sortedData.map(
      ({ stashId, commission, totalStake, estimatedPoolReward, numOfNominators, rewardsPer100KSM, riskScore }) => ({
        stashId,
        commission,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
      }),
    );
    // console.log('arr1', arr1);
    const lowRiskSortArr = sortLowRisk(arr1);
    const medRiskSortArr = sortMedRisk(arr1);
    if (!(arr1.length > 0)) {
      res.json([]);
      return;
    }

    // console.log('lowRiskSortArr', lowRiskSortArr);
    // console.log('medRiskSortArr', medRiskSortArr);

    // console.log(sortedData)
    const lowriskset = lowRiskSortArr.slice(0, 16);
    const medriskset = medRiskSortArr.slice(0, 16);
    const highriskset = arr1.slice(0, 16);
    // console.log(result)
    const result = {
      lowriskset: lowriskset,
      medriskset: medriskset,
      highriskset: highriskset,
      totalset: arr1,
    };
    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error attaching user to req: %o', e);
    return next(e);
  }
};

export default risk_set;

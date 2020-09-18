import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { sortLowRisk, sortMedRisk, HttpError } from '../../services/utils';

const risk_set = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const Validators = Container.get('Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const sortedData = await Validators.aggregate([
      {
        $match: {
          isNextElected: true,
        },
      },
      {
        $lookup: {
          from: 'accountidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
      {
        $sort: {
          rewardsPer100KSM: -1,
        },
      },
    ]);

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.numOfNominators = x.nominators.length;
      x.ownStake = x.isElected ? x.ownStake / Math.pow(10, 12) : null;
      x.othersStake = x.isElected ? x.nominators.reduce((a, b) => a + b.stake, 0) / Math.pow(10, 12) : null;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
      x.name = x.info[0] !== undefined ? x.info[0].display : null;
    });

    const arr1 = sortedData.map(
      ({
        stashId,
        commission,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
        ownStake,
        othersStake,
      }) => ({
        stashId,
        commission,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
        ownStake,
        othersStake,
      }),
    );

    const lowRiskSortArr = sortLowRisk(arr1);
    const medRiskSortArr = sortMedRisk(arr1);

    const highriskset = arr1.slice(0, 16);
    const result = {
      lowriskset: lowRiskSortArr.length > 16 ? lowRiskSortArr.slice(0, 16) : lowRiskSortArr,
      medriskset: medRiskSortArr.length > 16 ? medRiskSortArr.slice(0, 16) : medRiskSortArr,
      highriskset: highriskset,
      totalset: arr1,
    };
    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating risk-sets: %o', e);
    return next(e);
  }
};

export default risk_set;

import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { sortLowRisk, sortMedRisk, sortHighRisk, HttpError, getNetworkDetails } from '../../services/utils';
import { isNil } from 'lodash';

const risk_set = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const Validators = Container.get(networkDetails.name + 'Validators') as mongoose.Model<
      IStakingInfo & mongoose.Document
    >;

    const sortedData = await Validators.aggregate([
      {
        $match: { $and: [{ isElected: true }, { isNextElected: true }] },
      },
      // {
      //   $match: { isNextElected: true },
      // },
      {
        $lookup: {
          from: networkDetails.name + 'accountidentities',
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
      x.totalStake = x.totalStake / Math.pow(10, networkDetails.decimalPlaces);
      x.numOfNominators = x.nominators.length;
      x.ownStake = x.ownStake / Math.pow(10, networkDetails.decimalPlaces);
      x.othersStake = x.totalStake - x.ownStake;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, networkDetails.decimalPlaces);
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
        oversubscribed,
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
        oversubscribed,
        name,
        ownStake,
        othersStake,
      }),
    );

    const lowRiskSortArr = sortLowRisk(arr1);
    const medRiskSortArr = sortMedRisk(arr1);
    const highRiskSortArr = sortHighRisk(arr1);

    const result = {
      lowriskset: lowRiskSortArr.length > 16 ? lowRiskSortArr.slice(0, 16) : lowRiskSortArr,
      medriskset: medRiskSortArr.length > 16 ? medRiskSortArr.slice(0, 16) : medRiskSortArr,
      highriskset: highRiskSortArr.length > 16 ? highRiskSortArr.slice(0, 16) : highRiskSortArr,
      totalset: arr1,
    };
    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating risk-sets: %o', e);
    return next(e);
  }
};

export default risk_set;

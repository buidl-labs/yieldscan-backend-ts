import { Container } from 'typedi';
import mongoose from 'mongoose';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
// import { sortLowRisk, sortMedRisk } from '../../services/utils'
import { getNetworkDetails, HttpError } from '../../services/utils';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';
import { isNil } from 'lodash';

const top_validator = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const TotalRewardHistory = Container.get(networkDetails.name + 'TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);

    const eraIndex = lastIndexDB[0].eraIndex;
    const eraTotalReward = lastIndexDB[0].eraTotalReward;

    const ValidatorHistory = Container.get(networkDetails.name + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;
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
          from: networkDetails.name + 'accountidentities',
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
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, networkDetails.decimalPlaces);
      x.estimatedPoolReward =
        ((x.eraPoints / x.totalEraPoints) * eraTotalReward) / Math.pow(10, networkDetails.decimalPlaces);
    });
    const result = sortedData.map(({ stashId, commission, totalStake, estimatedPoolReward, info, eraIndex }) => ({
      stashId,
      commission,
      totalStake,
      estimatedPoolReward,
      info,
      eraIndex,
    }));
    return res.status(200).json(result);
  } catch (e) {
    Logger.error('🔥 Error fetching max-set: %o', e);
    return next(e);
  }
};

export default top_validator;

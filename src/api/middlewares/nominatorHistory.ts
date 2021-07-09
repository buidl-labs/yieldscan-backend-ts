import { Container } from 'typedi';
import mongoose from 'mongoose';

import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

const nominatorHistory = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const queryId = req.query?.id;
  try {
    if (isNil(queryId)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const ValidatorHistory = Container.get(networkDetails.name + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;

    const historyData = await ValidatorHistory.aggregate([
      { $unwind: '$nominatorsInfo' },
      {
        $match: { 'nominatorsInfo.nomId': queryId },
      },
      {
        $group: {
          _id: '$nominatorsInfo.nomId',
          totalStakeAmount: { $sum: '$nominatorsInfo.nomStake' },
          stakeAmountArr: { $push: '$nominatorsInfo.nomStake' },
          eraIndex: { $push: '$eraIndex' },
          count: { $sum: 1 },
        },
      },
    ]);
    if (historyData.length === 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }

    return res.status(200).json(historyData[0]);
  } catch (e) {
    Logger.error('🔥 Error fetching nominators data: %o', e);
    return next(e);
  }
};

export default nominatorHistory;

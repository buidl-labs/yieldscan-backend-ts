import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';

const validatorsInfo = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const stashIds = req.query.stashIds.split(',');
    const Validators = Container.get(networkDetails.name + 'Validators') as mongoose.Model<
      IStakingInfo & mongoose.Document
    >;

    const data = await Validators.aggregate([
      {
        $match: {
          stashId: { $in: stashIds },
        },
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
      x.totalStake = x.totalStake / Math.pow(10, networkDetails.decimalPlaces);
      x.ownStake = x.ownStake / Math.pow(10, networkDetails.decimalPlaces);
      x.othersStake = x.totalStake - x.ownStake;
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, networkDetails.decimalPlaces);
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

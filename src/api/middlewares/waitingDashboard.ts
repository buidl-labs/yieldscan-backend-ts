import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { HttpError } from '../../services/utils';

const waitingDashboard = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const Validators = Container.get('Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const sortedData = await Validators.aggregate([
      {
        $match: {
          isWaiting: true,
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
      x.ownStake = x.ownStake / Math.pow(10, 12);
      x.othersStake = x.totalStake - x.ownStake;
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
      x.name = x.info[0] !== undefined ? x.info[0].display : null;
    });

    const result = sortedData.map(
      ({
        stashId,
        commission,
        othersStake,
        ownStake,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
      }) => ({
        stashId,
        commission,
        othersStake,
        ownStake,
        totalStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
      }),
    );

    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching validators data: %o', e);
    return next(e);
  }
};

export default waitingDashboard;

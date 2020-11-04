import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IActiveNominators } from '../../interfaces/IActiveNominators';
import { HttpError } from '../../services/utils';

const nominatorsDashboard = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const ActiveNominators = Container.get('ActiveNominators') as mongoose.Model<IActiveNominators & mongoose.Document>;
    const sortedData = await ActiveNominators.aggregate([
      {
        $match: {
          'validatorsInfo.isElected': true,
        },
      },
      // removed/commented lookup for accountIdentity because it was reducing performance for
      // fetching all the nominators identity at once
      // Todo: add pagination for better performance with identity.
      // {
      //   $lookup: {
      //     from: 'accountidentities',
      //     localField: 'nomId',
      //     foreignField: 'accountId',
      //     as: 'info',
      //   },
      // },
      {
        $sort: {
          dailyEarnings: -1,
        },
      },
    ]);

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    const nomCount = sortedData.length;
    const totalRewards = sortedData.reduce((a, b) => a + b.dailyEarnings, 0);
    const totalAmountStaked = sortedData.reduce((a, b) => {
      const nomtotalStake = b.validatorsInfo.reduce((x, y) => {
        return y.nomStake !== (null || undefined) ? x + y.nomStake : x;
      }, 0);
      return a + nomtotalStake / Math.pow(10, 18);
    }, 0);

    const nominatorsInfo = sortedData.map((x) => {
      const nomtotalStake =
        x.validatorsInfo.reduce((a, b) => (b.nomStake !== (null || undefined) ? a + b.nomStake : a), 0) /
        Math.pow(10, 18);
      const nominations = x.validatorsInfo.length;
      return {
        nomId: x.nomId,
        nomtotalStake: nomtotalStake,
        dailyEarnings: x.dailyEarnings,
        nominations: nominations,
        // name: x.info[0] !== undefined ? x.info[0].display : null,
      };
    });

    const result = {
      stats: {
        nominatorsCount: nomCount,
        totalRewards: totalRewards,
        totalAmountStaked: totalAmountStaked,
      },
      top3: nominatorsInfo.slice(0, 3),
      nominatorsInfo: nominatorsInfo,
    };

    return res.status(200).json(result);
  } catch (e) {
    Logger.error('🔥 Error fetching nominators data: %o', e);
    return next(e);
  }
};

export default nominatorsDashboard;

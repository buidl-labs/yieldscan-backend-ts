import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IActiveNominators } from '../../interfaces/IActiveNominators';

const nominatorsDashboard = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const ActiveNominators = Container.get('ActiveNominators') as mongoose.Model<IActiveNominators & mongoose.Document>;
    const sortedData = await ActiveNominators.find({}).sort({
      dailyEarnings: -1,
    });

    const nomCount = sortedData.length;
    const totalRewards = sortedData.reduce((a, b) => a + b.dailyEarnings, 0);
    const totalAmountStaked = sortedData.reduce((a, b) => {
      const nomtotalStake = b.validatorsInfo.reduce((x, y) => x + y.nomStake, 0);
      return a + nomtotalStake / Math.pow(10, 12);
    }, 0);

    const nominatorsInfo = sortedData.map((x) => {
      const nomtotalStake = x.validatorsInfo.reduce((x, y) => y.nomStake, 0) / Math.pow(10, 12);
      const nominations = x.validatorsInfo.length;
      return {
        nomId: x.nomId,
        nomtotalStake: nomtotalStake,
        dailyEarnings: x.dailyEarnings,
        nominations: nominations,
      };
    });

    const result = {
      stats: {
        nominatorsCount: nomCount,
        totalRewards: totalRewards,
        totalAmountStaked: totalAmountStaked,
      },
      nominatorsInfo: nominatorsInfo,
    };

    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error attaching user to req: %o', e);
    return next(e);
  }
};

export default nominatorsDashboard;
